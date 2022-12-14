import { dirname, endWith, fromFileUrl, Status } from "./deps.ts";
import type { Handler, Hydra, Plugin } from "./types.ts";

export interface Params {
  readonly inputs: Iterable<Plugin>;
}

export interface Options {
  readonly fallback?: Response;
}

interface VoidableHandler {
  (request: Request): Response | void | Promise<Response | void>;
}

type RouteEntry = [URLPattern, VoidableHandler];

class Collector implements Hydra {
  entries: RouteEntry[] = [];

  on = (input: URLPatternInput, fn: VoidableHandler) => {
    const pattern = new URLPattern(input);
    this.entries.push([pattern, fn]);
  };
}

const NotFoundResponse = new Response(null, { status: Status.NotFound });

export async function createHandler(
  params: Params,
  { fallback = NotFoundResponse }: Options = {},
): Promise<Handler> {
  const routes = await createRoutes(params);
  const entries = trailingSlashEntries(routes);

  return async (request) => {
    for (const [pattern, handler] of entries) {
      if (pattern.test(request.url)) {
        const maybeResponse = await handler(request);

        if (maybeResponse) {
          return maybeResponse;
        }
      }
    }
    return fallback;
  };
}

export async function createRoutes(params: Params): Promise<RouteEntry[]> {
  const inputs = Array.from(params.inputs);
  const baseUrl = import.meta.url;
  const rootDir = dirname(fromFileUrl(baseUrl));
  const collector = new Collector();

  await Promise.all(inputs.map((input) => {
    return input.setup(collector, { rootDir });
  }));

  return collector.entries;
}

function removeTrailingSlash(input: string): string {
  return input.replaceAll(/\/+$/g, "");
}

function trailingSlashEntries(entries: Iterable<RouteEntry>): RouteEntry[] {
  const result = Array.from(entries).reduce((acc, [pattern, handler]) => {
    const entry: RouteEntry = [pattern, handler];
    if (endWith(pattern.pathname, "/")) {
      return [...acc, entry];
    }

    const redirectEntry: RouteEntry = [
      tailingSlashableURLPattern(pattern),
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

function tailingSlashableURLPattern(
  input: { readonly pathname: string },
): URLPattern {
  const pathname = endWith(input.pathname, "/")
    ? input.pathname
    : input.pathname + "/";
  return new URLPattern({ ...input, pathname });
}
