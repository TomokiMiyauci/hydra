import {
  common,
  ensureDir,
  extname,
  resolve,
  typeByExtension,
  walk,
  type WalkOptions,
} from "../deps.ts";
import type { Plugin } from "../types.ts";

export interface UseStaticOptions {
  /**
   * @default "static"
   */
  readonly dirName?: string;
}

const DEFAULT_DIR_NAME = "static";
const DEFAULT_CONTENT_TYPE = "application/octet-stream";
const WalkOptions: WalkOptions = {
  includeFiles: true,
  includeDirs: false,
  followSymlinks: false,
};

/** Plugin for static file serving. */
export function useStatic(
  options?: UseStaticOptions,
): Plugin {
  const { dirName = DEFAULT_DIR_NAME } = options ?? {};
  return {
    name: "static-file-routing",
    setup: async (hydra, { rootDir }) => {
      const dirPath = resolve(rootDir, dirName);

      await ensureDir(dirPath);

      const entries = walk(dirPath, WalkOptions);

      for await (const { isFile, path } of entries) {
        const duplicated = common([path, dirPath]);
        const absPath = path.substring(duplicated.length);
        const contentType = typeByExtension(extname(absPath)) ??
          DEFAULT_CONTENT_TYPE;
        const pathname = resolve("/", absPath);

        if (isFile) {
          hydra.on({ pathname }, async () => {
            const fsFile = await Deno.open(path);

            return new Response(fsFile.readable, {
              headers: {
                "content-type": contentType,
              },
            });
          });
        }
      }
    },
  };
}
