import {
  extract,
  install,
  TwindConfig,
  TwindUserConfig,
} from "https://esm.sh/v99/@twind/core@1.0.3";
import { h, render } from "../deps.ts";
import type { Plugin } from "../types.ts";

export interface Options {
  /** Customize inject style element attributes. */
  readonly attrs: Record<string, string | boolean | number>;
}

export default function useTwind(
  config: TwindConfig | TwindUserConfig,
  options?: Partial<Options>,
): Plugin {
  install(config as TwindConfig);

  return {
    name: "twind",

    setup: (hydra) => {
      hydra.onTransform("text/html", (html) => inline(html, options?.attrs));
    },
  };
}

export function inline(
  markup: string,
  attrs?: Record<string, string | boolean | number>,
): string {
  const { html, css } = extract(markup);
  const node = h(
    "style",
    { ...attrs, dangerouslySetInnerHTML: { __html: css } } as never,
  );
  const styleTag = render(node);

  return html.replace("</head>", `${styleTag}</head>`);
}
