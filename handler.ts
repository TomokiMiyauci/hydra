import {
  dirname,
  DOMParser,
  endWith,
  extname,
  fromFileUrl,
  parseMediaType,
  serializeHtml,
  Status,
} from "./deps.ts";
import type { Handler, Hydra, Plugin, RenderResult } from "./types.ts";

export interface Params {
  readonly inputs: Iterable<Plugin>;
}

export interface Options {
  readonly fallback: Response;

  /** Whether the environment is production or not.
   * @default false
   */
  readonly isProduction: boolean;

  /**
   * @default import.meta.url
   */
  readonly baseUrl: string;
}

interface VoidableHandler {
  (request: Request): Response | void | Promise<Response | void>;
}

type RouteEntry = [URLPattern, VoidableHandler];

class Collector implements Hydra {
  entries: RouteEntry[] = [];
  renderers: ((params: RenderResult) => Partial<RenderResult> | void)[] = [];

  on = (input: URLPatternInput, fn: VoidableHandler) => {
    const pattern = new URLPattern(input);
    this.entries.push([pattern, fn]);
  };

  render = (fn: (params: RenderResult) => Partial<RenderResult> | void) => {
    this.renderers.push(fn);
  };
}

const NotFoundResponse = new Response(null, { status: Status.NotFound });

export async function createHandler(
  params: Params,
  options?: Partial<Options>,
): Promise<Handler> {
  const { fallback = NotFoundResponse, ...rest } = options ?? {};

  const collector = await createCollector(params, rest);
  const routes = trailingSlashEntries(collector.entries);

  return async (request) => {
    for (const [pattern, handler] of routes) {
      if (pattern.test(request.url)) {
        const maybeResponse = await handler(request);

        if (maybeResponse) {
          const type = maybeResponse.headers.get("content-type");
          if (!type) return maybeResponse;

          const mediaType = parseMediaType(type)[0];

          if (mediaType === "text/html") {
            const domParser = new DOMParser();
            const text = await maybeResponse.text();
            const htmlDocument = domParser.parseFromString(text, mediaType);

            if (!htmlDocument) {
              throw Error("invalid HTML");
            }

            const result = collector.renderers.reduce((acc, cur) => {
              const result = cur(acc);

              return { ...acc, ...result };
            }, { document: htmlDocument } as RenderResult);

            const html = serializeHtml(result.document);

            return new Response(html, maybeResponse);
          }

          return maybeResponse;
        }
      }
    }
    return fallback;
  };
}

export async function createCollector(
  params: Params,
  options?: Partial<Options>,
): Promise<Collector> {
  const { isProduction = false } = options ?? {};
  const inputs = Array.from(params.inputs);
  const baseUrl = import.meta.url;
  const rootDir = dirname(fromFileUrl(baseUrl));
  const collector = new Collector();

  await Promise.all(inputs.map((input) => {
    return input.setup(collector, { rootDir, isProduction });
  }));

  return collector;
}

function removeTrailingSlash(input: string): string {
  return input.replaceAll(/\/+$/g, "");
}

export function trailingSlashEntries(
  entries: Iterable<RouteEntry>,
): RouteEntry[] {
  const result = Array.from(entries).reduce((acc, [pattern, handler]) => {
    const entry: RouteEntry = [pattern, handler];
    if (endWith(pattern.pathname, "/")) {
      return [...acc, entry];
    }

    const redirectEntry: RouteEntry = [
      new URLPattern(tailingSlashableURLPattern(pattern)),
      redirectTrailingSlashEndpoint,
    ];
    const entries: RouteEntry[] = [entry, redirectEntry];

    return [...acc, ...entries];
  }, [] as RouteEntry[]);

  return result;
}

function redirectTrailingSlashEndpoint(request: Request): Response {
  const url = new URL(request.url);
  const pathname = removeTrailingSlash(url.pathname);

  url.pathname = pathname;
  return Response.redirect(url, Status.TemporaryRedirect);
}

export function tailingSlashableURLPattern(
  input: { readonly pathname: string },
): URLPatternInit {
  if (extname(input.pathname)) return input;

  const pathname = endWith(input.pathname, "/")
    ? input.pathname
    : input.pathname + "/";
  return { ...input, pathname };
}
