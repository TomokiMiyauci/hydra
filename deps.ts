export type { BuildOptions } from "https://deno.land/x/esbuild@v0.14.51/mod.js";
export {
  basename,
  common,
  dirname,
  extname,
  fromFileUrl,
  join,
  parse,
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.167.0/path/mod.ts";
export {
  walk,
  type WalkOptions,
} from "https://deno.land/std@0.167.0/fs/walk.ts";
export { ensureDir } from "https://deno.land/std@0.167.0/fs/ensure_dir.ts";
export { Status } from "https://deno.land/std@0.167.0/http/http_status.ts";
export {
  contentType,
  typeByExtension,
} from "https://deno.land/std@0.167.0/media_types/mod.ts";
export { gte } from "https://deno.land/std@0.167.0/semver/mod.ts";
export { parse as parseFlag } from "https://deno.land/std@0.167.0/flags/mod.ts";
export {
  render,
} from "https://esm.sh/v99/preact-render-to-string@5.2.6?deps=preact@10.11.3";
export {
  type ComponentChildren,
  createContext,
  Fragment,
  h,
  isValidElement,
  type JSX,
} from "https://esm.sh/v99/preact@10.11.3";
export { useContext } from "https://esm.sh/v99/preact@10.11.3/hooks";
export {
  hasOwn,
  isFunction,
} from "https://deno.land/x/isx@1.0.0-beta.24/mod.ts";

export function endWith(
  input: string,
  searchString: string,
  endPosition?: number,
): boolean {
  return input.endsWith(searchString, endPosition);
}
