import { ensureDir, join, parse, resolve } from "../../deps.ts";
import { collect, generate } from "./manifest.ts";
import type { Plugin } from "../../types.ts";
import type { Manifest, Resolver } from "./types.ts";

const DEFAULT_DIR_NAME = "pages";
const DEFAULT_MANIFEST_NAME = "hydra.gen.ts";
const PLUGIN_NAME = "file-system-routing";

export interface Params {
  readonly resolvers: Iterable<Resolver>;

  readonly manifest: Manifest;
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
    setup: async (hydra, { rootDir, isProduction }) => {
      const dirPath = resolve(rootDir, dirName);

      await ensureDir(dirPath);

      for (const [absPath, module] of Object.entries(params.manifest.pages)) {
        const pattern = pathToPattern(absPath);

        hydra.on(pattern, async (request) => {
          for (const resolver of params.resolvers) {
            const maybeResponse = await resolver(module, { request });

            if (maybeResponse) {
              return maybeResponse;
            }
          }
        });
      }

      if (!isProduction) {
        const manifest = await collect(dirPath);
        const manifestPath = join(rootDir, DEFAULT_MANIFEST_NAME);
        await generate(manifestPath, manifest);
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
