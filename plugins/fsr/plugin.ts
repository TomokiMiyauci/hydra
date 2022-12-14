import { ensureDir, join, parse, resolve } from "../../deps.ts";
import { collect, equal, generate } from "./manifest.ts";
import type { Plugin } from "../../types.ts";
import type { Manifest, Resolver, Resource } from "./types.ts";
import { Store } from "../../utils.ts";

const DEFAULT_DIR_NAME = "pages";
const DEFAULT_MANIFEST_NAME = "hydra.gen.ts";
const STORE_KEY = "HYDRA_PREV_MANIFEST";
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
        const store = new Store(STORE_KEY);
        const value = store.get();

        const prevResource: Resource = value
          ? JSON.parse(value)
          : { pages: [] };
        const resource = await collect(dirPath);

        if (!equal(prevResource, resource)) {
          const manifestPath = join(rootDir, DEFAULT_MANIFEST_NAME);
          await generate(manifestPath, resource);
        }
        const resourceStr = JSON.stringify(resource);
        store.set(resourceStr);
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
