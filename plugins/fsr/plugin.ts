import {
  common,
  ensureDir,
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
          // deno-lint-ignore ban-types
          const module = await import(path) as {};

          for (const resolver of params.resolvers) {
            const maybeResponse = await resolver(
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
export function pathToPattern(path: string): URLPatternInput {
  const parsed = parse(path);

  const name = parsed.name === "index" ? "" : dynamicName(parsed.name);
  const dir = parsed.dir.replaceAll(ReBracket, replacer);
  const subpath = name ? join("/", name) : "";
  const pathname = join(dir, subpath);

  return { pathname };
}

function replacer(...rest: readonly unknown[]): string {
  return ":" + rest[1];
}

const ReBracket = /\[(.+)\]/g;

function dynamicName(input: string): string {
  const result = ReBracket.exec(input);

  if (!result) return input;

  return replacer(...result);
}
