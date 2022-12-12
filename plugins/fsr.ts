import {
  common,
  contentType,
  ensureDir,
  join,
  parse,
  resolve,
  walk,
  type WalkOptions,
} from "../deps.ts";
import type { Plugin } from "../types.ts";
import type { VNode } from "preact";
import { renderToString } from "preact-render-to-string";
import Html from "./Html.tsx";

const WalkOptions: WalkOptions = {
  includeFiles: true,
  includeDirs: false,
  followSymlinks: false,
};
const DEFAULT_DIR_NAME = "pages";
const PLUGIN_NAME = "file-system-routing";

interface Options {
  readonly dirName?: string;
}

interface Module {
  readonly default?: () => VNode;
}

interface Context {
  readonly path: string;
}

interface Params {
  render: Render;
}

interface Render {
  (
    context: Context,
  ): BodyInit | null | undefined | Promise<BodyInit | null | undefined>;
}

export const renderPreact: Render = async ({ path }) => {
  const module = await import(path) as Module;

  const vNode = module.default?.();
  if (!vNode) return;

  const bodyHtml = renderToString(vNode);
  const html = renderToString(Html({ content: bodyHtml }));
  const document = DOCTYPE + html;

  return document;
};

const DOCTYPE = "<!DOCTYPE html>";

/** File system routing. */
export function useFsr(params: Params, options?: Options): Plugin {
  const { dirName = DEFAULT_DIR_NAME } = options ?? {};

  return {
    name: PLUGIN_NAME,
    setup: async (hydra, { rootDir }) => {
      const dirPath = resolve(rootDir, dirName);

      await ensureDir(dirPath);

      const entries = walk(dirPath, WalkOptions);

      for await (const { isFile, path } of entries) {
        if (!isFile) return;

        const duplicated = common([path, dirPath]);
        const absPath = path.substring(duplicated.length);
        const pattern = pathToPattern(resolve("/", absPath));

        hydra.on(pattern, async () => {
          const body = await params.render({ path });

          return new Response(body, {
            headers: {
              "content-type": contentType("html"),
            },
          });
        });
      }
    },
  };
}

/** Transform a filesystem URL path to a `path-to-regex` style matcher. */
function pathToPattern(path: string): URLPatternInput {
  const parsed = parse(path);

  const name = parsed.name === "index" ? "" : parsed.name;
  const pathname = join("/", parsed.dir, "/", name);

  return { pathname };
}
