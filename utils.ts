import type * as deps from "./deps.ts";

/** Output error message to console. */
export function printError(message: string): void {
  console.error(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
}

/** Show error message and exit as stderr. */
export function error(message: string): never {
  printError(message);
  Deno.exit(1);
}

export const WalkOptions: deps.WalkOptions = {
  includeDirs: false,
  includeFiles: true,
  followSymlinks: false,
};

export class Store {
  #key: string;
  constructor(key: string) {
    this.#key = key;
  }
  get(): string | undefined {
    return Deno.env.get(this.#key);
  }

  set(input: string): void {
    Deno.env.set(this.#key, input);
  }
}
