import {
  common,
  ensureDir,
  hasOwn,
  isFunction,
  join,
  parse,
  resolve,
  walk,
  type WalkOptions,
} from "../../deps.ts";
import type { Plugin } from "../../types.ts";
import type { Handler, Resolver } from "./types.ts";

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

export function resolveHandler(params: {
  render: Resolver;
}): Resolver {
  return (module, ctx) => {
    if (!hasOwn("handler", module)) return;

    const handler = module.handler;

    if (!isFunction(handler)) return;

    async function render(): Promise<Response> {
      const res = await params.render(module, ctx);

      if (res) return res;

      throw Error("response should be Response or Promise response");
    }

    const result = (handler as Handler)(ctx.request, {
      render,
    });

    if (result instanceof Response) {
      return result;
    }
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

      for await (const { isFile, path } of entries) {
        if (!isFile) return;

        const duplicated = common([path, dirPath]);
        const absPath = path.substring(duplicated.length);
        const pattern = pathToPattern(resolve("/", absPath));

        hydra.on(pattern, async (request) => {
          const module = await import(path) as {};

          for (const resolver of params.resolvers) {
            const maybeResponse = resolver(
              module,
              { request, path },
            );

            if (maybeResponse) {
              return maybeResponse;
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
