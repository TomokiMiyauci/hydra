import type { HTMLDocument } from "./deps.ts";

export interface Hydra {
  on: (
    pattern: URLPatternInput,
    fn: (request: Request) => Response | void | Promise<Response | void>,
  ) => void;

  render: (fn: (params: RenderResult) => Partial<RenderResult> | void) => void;
}

export interface RenderResult {
  document: HTMLDocument;
}

export interface Plugin {
  readonly name: string;
  readonly setup: (
    instance: Hydra,
    context: Context,
  ) => void | Promise<void>;
}

export interface Handler {
  (request: Request): Response | Promise<Response>;
}

export interface Context {
  /** Whether the environment is production or not. */
  readonly isProduction: boolean;

  readonly rootDir: string;
}
