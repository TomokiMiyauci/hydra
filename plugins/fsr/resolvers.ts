import { hasOwn, isFunction } from "../../deps.ts";
import type { Handler, Resolver } from "./types.ts";

export interface Params {
  readonly render: (data?: unknown) => Resolver;
}

export interface Options {
  /**
   * @default "handler"
   */
  readonly exportName: string;
}

const DEFAULT_EXPORT_NAME = "handler";

export function resolveHandler(
  params: Params,
  options?: Partial<Options>,
): Resolver {
  const { exportName = DEFAULT_EXPORT_NAME } = options ?? {};

  return async (module, ctx) => {
    if (!hasOwn(exportName, module)) return;

    const handler = module.handler;

    if (!isFunction(handler)) return;

    async function render(data: unknown): Promise<Response> {
      const res = await params.render(data)(module, ctx);

      if (res) return res;

      throw Error("response should be Response or Promise response");
    }

    const result = (handler as Handler)(ctx.request, { render });
    const response = await result;

    return response;
  };
}
