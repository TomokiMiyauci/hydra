import {
  common,
  ensureDir,
  isFunction,
  join,
  parse,
  resolve,
  walk,
  type WalkOptions,
} from "../../deps.ts";
import type { Plugin } from "../../types.ts";
import type { Resolver } from "./types.ts";

const WalkOptions: WalkOptions = {
  includeFiles: true,
  includeDirs: false,
  followSymlinks: false,
};
const DEFAULT_DIR_NAME = "pages";
const PLUGIN_NAME = "file-system-routing";

export interface Params {
  readonly resolvers: Iterable<Resolver>;
}

/** Plugin options. */
export interface Options {
  /**
   * @default "pages"
   */
  readonly dirName?: string;
}

export function resolveHandler(): Resolver {
  const name = "handler";

  return {
    moduleName: name,
    resolve: (module, request) => {
      if (!isFunction(module)) return;

      const result = module(request) as unknown;

      if (result instanceof Response) {
        return result;
      }
    },
  };
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
      const resolvers = Array.from(params.resolvers);

      for await (const { isFile, path } of entries) {
        if (!isFile) return;

        const duplicated = common([path, dirPath]);
        const absPath = path.substring(duplicated.length);
        const pattern = pathToPattern(resolve("/", absPath));

        hydra.on(pattern, async (request) => {
          const module = await import(path);

          for (const resolver of resolvers) {
            if (resolver.moduleName in module) {
              const exportedModule = module[resolver.moduleName] as unknown;

              const maybeResponse = resolver.resolve(exportedModule, request);

              if (maybeResponse) {
                return maybeResponse;
              }
            }
          }
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
