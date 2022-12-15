import {
  inline,
  install,
  TwindConfig,
  TwindUserConfig,
} from "https://esm.sh/v99/@twind/core@1.0.3";
import type { Plugin } from "../types.ts";

export default function useTwind(
  config: TwindConfig | TwindUserConfig,
): Plugin {
  install(config as TwindConfig);

  return {
    name: "twind",

    setup: (hydra) => {
      hydra.onTransform("text/html", inline);
    },
  };
}
