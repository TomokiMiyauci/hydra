import { setup, tw } from "https://esm.sh/v99/twind@0.16.19";
import { virtualSheet } from "https://esm.sh/v99/twind@0.16.19/sheets";
import { distinct, Element } from "../deps.ts";
import type { Plugin } from "../types.ts";

export default function useTwind(): Plugin {
  const sheet = virtualSheet();
  setup({ sheet, mode: "silent" });

  return {
    name: "twind",

    setup: (hydra) => {
      hydra.render((fn) => {
        sheet.reset(undefined);

        const classNames = allClassNames(fn.document);
        tw(classNames);
        const cssTexts = [...sheet.target];

        if (!cssTexts.length) return;
        const cssText = cssTexts.join("\n");

        const el = fn.document.createElement("style");
        const textNode = fn.document.createTextNode(cssText);

        el.appendChild(textNode);
        fn.document.head.appendChild(el);

        return {
          document: fn.document,
        };
      });
    },
  };
}

function allClassNames(
  document: { querySelectorAll: (selector: string) => Iterable<unknown> },
): string[] {
  const classNames = [...document.querySelectorAll("*")].map((node) => {
    return [...(node as Element).classList];
  }).flat();

  return distinct(classNames);
}
