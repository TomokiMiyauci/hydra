export { createHandler, type Options, type Params } from "./handler.ts";
export { resolveHandler, useFsr } from "./plugins/fsr/plugin.ts";
export type {
  Handler,
  HandlerContext,
  HtmlProps,
  PageProps,
  RouteModule,
  RoutePage,
} from "./plugins/fsr/types.ts";
export { useStatic, type UseStaticOptions } from "./plugins/static.ts";
export * from "./preact/mod.ts";
