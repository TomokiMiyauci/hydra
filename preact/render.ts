import { ComponentChildren, h, JSX, render } from "../deps.ts";
import HtmlComponent from "./Html.tsx";
import { HEAD_CONTEXT } from "./Head.tsx";
import type { HtmlProps, Render, RouteModule } from "../plugins/fsr/types.ts";

export interface Options {
  readonly Html: (props: HtmlProps) => JSX.Element;
}

interface PreactRouteModule extends RouteModule {
  default: () => JSX.Element;
}

const DOCTYPE = "<!DOCTYPE html>";

export function createRender(options?: Partial<Options>): Render {
  const { Html = HtmlComponent } = options ?? {};

  return async (_, { path }) => {
    const module = await import(path) as PreactRouteModule;

    const vNode = module.default?.();
    const headComponents: ComponentChildren[] = [];
    const rendered = h(HEAD_CONTEXT.Provider, {
      value: headComponents,
      children: vNode,
    });

    if (!vNode || !rendered) return;

    const bodyHtml = render(rendered);
    const node = Html({
      HeadChildren: headComponents,
      bodyHtml,
    });
    const html = render(node);
    const document = DOCTYPE + html;

    return document;
  };
}
