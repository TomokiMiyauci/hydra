import {
  dirname,
  endWith,
  extname,
  fromFileUrl,
  isString,
  LRUMap,
  Status,
} from "./deps.ts";
import type { Config, Handler, Hooks, Plugin, Transform } from "./types.ts";

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

class Queue implements Hooks {
  entries: RouteEntry[] = [];
  transformers: [RegExp, Transform][] = [];

  on = (input: URLPatternInput, fn: VoidableHandler) => {
    const pattern = new URLPattern(input);
    this.entries.push([pattern, fn]);
  };

  onTransform = (contentType: RegExp | string, transform: Transform) => {
    this.transformers.push([new RegExp(contentType), transform]);
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
  const cache = new LRUMap<string, string>(100);

  async function resolve(
    key: string,
    fn: (input: string) => string | Promise<string>,
  ): Promise<string> {
    const cached = cache.get(key);

    if (isString(cached)) return cached;

    const value = await fn(key);

    cache.set(key, value);

    return value;
  }

  return async (request) => {
    for (const [pattern, handler] of routes) {
      if (!pattern.test(request.url)) continue;

      const maybeResponse = await handler(request);

      if (!maybeResponse) continue;

      const type = maybeResponse.headers.get("content-type");

      if (!type) return maybeResponse;

      const transforms = collector.transformers.filter(([pattern]) => {
        return pattern.test(type);
      }).map(([_, transform]) => transform);

      if (!transforms.length) return maybeResponse;

      const transformed = await transforms.reduce(async (acc, cur) => {
        return resolve(await acc, cur);
      }, maybeResponse.text());

      return new Response(transformed, maybeResponse);
    }

    return fallback;
  };
}

export async function createCollector(
  params: Params,
  options?: Partial<Options>,
): Promise<Queue> {
  const { isProduction = false } = options ?? {};
  const inputs = Array.from(params.inputs);
  const baseUrl = import.meta.url;
  const rootDir = dirname(fromFileUrl(baseUrl));
  const queue = new Queue();

  await Promise.all(inputs.map((input) => {
    return input.setup(queue, { rootDir, isProduction });
  }));

  return queue;
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

export class Hydra {
  isProd: boolean;
  baseUrl: string;
  plugins: Plugin[];

  constructor(config: Config) {
    this.isProd = config.isProd ?? true;
    this.baseUrl = config.baseUrl ?? import.meta.url;
    this.plugins = Array.from(config.plugins);
  }

  createHandler = async (): Promise<Handler> => {
    const handler = await createHandler({ inputs: this.plugins });

    return handler;
  };
}
