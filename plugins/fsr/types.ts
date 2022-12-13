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
