import { ComponentChildren } from "../../deps.ts";

export interface HandlerContext<Data = unknown> {
  readonly render: (data?: Data) => Response | Promise<Response>;
}

export interface Handler<Data = unknown> {
  (
    request: Request,
    context: HandlerContext<Data>,
  ): Response | Promise<Response>;
}

/** Props for HTML root component. */
export interface HtmlProps {
  /** String represent HTML body. */
  readonly bodyHtml: string;

  readonly HeadChildren: ComponentChildren;
}

export interface PageProps<T = unknown> {
  /** The URL of the request that resulted in this page being rendered. */
  readonly url: URL;

  /**
   * Additional data passed into {@link HandlerContext.render}`.
   * @default undefined
   */
  readonly data: T;
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
