import {
  common,
  contentType,
  ensureDir,
  join,
  parse,
  resolve,
  walk,
  type WalkOptions,
} from "../../deps.ts";
import type { Plugin } from "../../types.ts";
import type { Render } from "./types.ts";

const WalkOptions: WalkOptions = {
  includeFiles: true,
  includeDirs: false,
  followSymlinks: false,
};
const DEFAULT_DIR_NAME = "pages";
const PLUGIN_NAME = "file-system-routing";

export interface Params {
  readonly resolvers: Resolvers;
}

/** Plugin options. */
export interface Options {
  /**
   * @default "pages"
   */
  readonly dirName?: string;
}

export interface Resolvers {
  default: Render;
}

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

        hydra.on(pattern, async (request) => {
          const body = await params.resolvers.default(request, { path });

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
