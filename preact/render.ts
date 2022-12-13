import {
  ComponentChildren,
  contentType,
  h,
  hasOwn,
  isFunction,
  isValidElement,
  JSX,
  render,
} from "../deps.ts";
import HtmlComponent from "./Html.tsx";
import { HEAD_CONTEXT } from "./Head.tsx";
import type { HtmlProps, PageProps, Resolver } from "../plugins/fsr/types.ts";

export interface Options {
  /**
   * @default "default"
   */
  readonly exportName: string;

  readonly Html: (props: HtmlProps) => JSX.Element;
}

interface Component {
  (props: PageProps): unknown;
}

const DOCTYPE = "<!DOCTYPE html>";
const DEFAULT_EXPORT_NAME = "default";

export function resolveComponent(
  options?: Partial<Options>,
): Resolver {
  const { Html = HtmlComponent, exportName = DEFAULT_EXPORT_NAME } = options ??
    {};

  return ((module, ctx) => {
    if (!hasOwn(exportName, module)) return;

    const exported = module[exportName];

    if (!isFunction(exported)) return;

    const url = new URL(ctx.request.url);
    const props: PageProps = { url };
    const vNode = (exported as Component)(props);

    if (isValidElement(vNode)) {
      const headComponents: ComponentChildren[] = [];
      const rendered = h(HEAD_CONTEXT.Provider, {
        value: headComponents,
        children: vNode,
      });

      const bodyHtml = render(rendered);

      const node = Html({
        HeadChildren: headComponents,
        bodyHtml,
      });
      const html = render(node);
      const document = DOCTYPE + html;

      return new Response(document, {
        headers: {
          "content-type": contentType("html"),
        },
      });
    }
  });
}
