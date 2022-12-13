import { ComponentChildren } from "../../deps.ts";

export interface HandlerContext {
  readonly render: (data: unknown) => Response | Promise<Response>;
}

export interface Handler {
  (request: Request, context: HandlerContext): Response | Promise<Response>;
}

export interface RoutePage {
  (): unknown;
}

/** Module for route. */
export interface RouteModule {
  default: RoutePage;
  handler: Handler;
}

interface RenderContext {
  readonly path: string;
}

export interface Render {
  (
    request: Request,
    context: RenderContext,
  ): BodyInit | null | undefined | Promise<BodyInit | null | undefined>;
}

/** Props for HTML root component. */
export interface HtmlProps {
  /** String represent HTML body. */
  readonly bodyHtml: string;

  readonly HeadChildren: ComponentChildren;
}

export interface PageProps {
  /** The URL of the request that resulted in this page being rendered. */
  readonly url: URL;
}

export interface ResolverContext {
  readonly path: string;
  readonly request: Request;
}

export interface Resolver {
  (
    // deno-lint-ignore ban-types
    module: {},
    context: ResolverContext,
  ): void | Response | Promise<Response | void>;
}
