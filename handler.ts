import { dirname, fromFileUrl, Status } from "./deps.ts";
import type { Handler, Hydra, Plugin } from "./types.ts";

export interface Params {
  readonly inputs: Iterable<Plugin>;
}

export interface Options {
  readonly fallback?: Response;
}

interface Route {
  pattern: URLPattern;
  handler: (request: Request) => Response | void | Promise<Response | void>;
}

class HydraImpl implements Hydra {
  #routes: Route[] = [];
  constructor() {}
  on = (
    input: URLPatternInput,
    fn: (request: Request) => Response | void | Promise<Response | void>,
  ) => {
    const pattern = new URLPattern(input);
    this.#routes.push({ pattern, handler: fn });
  };

  response(request: Request): Response | void | Promise<Response | void> {
    for (const route of this.#routes) {
      if (route.pattern.test(request.url)) {
        return route.handler(request);
      }
    }
  }
}

const NotFoundResponse = new Response(null, { status: Status.NotFound });

export function createHandler(
  params: Params,
  { fallback = NotFoundResponse }: Options = {},
): Handler {
  const inputs = Array.from(params.inputs);
  const hydra = new HydraImpl();
  const baseUrl = import.meta.url;
  const rootDir = dirname(fromFileUrl(baseUrl));

  inputs.forEach((input) => {
    input.setup(hydra, { rootDir });
  });

  return async (request) => {
    return await hydra.response(request) ?? fallback;
  };
}
