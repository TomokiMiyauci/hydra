import {
  ComponentChildren,
  contentType,
  h,
  isFunction,
  isValidElement,
  JSX,
  render,
} from "../deps.ts";
import HtmlComponent from "./Html.tsx";
import { HEAD_CONTEXT } from "./Head.tsx";
import type { HtmlProps, Resolver } from "../plugins/fsr/types.ts";

export interface Options {
  readonly Html: (props: HtmlProps) => JSX.Element;
}

const DOCTYPE = "<!DOCTYPE html>";

export function resolveComponent(
  options?: Options,
): Resolver {
  const { Html = HtmlComponent } = options ?? {};
  const name = "default";

  return {
    moduleName: name,
    resolve: (module) => {
      if (!isFunction(module)) return;

      const vNode = module() as unknown;

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
    },
  };
}
