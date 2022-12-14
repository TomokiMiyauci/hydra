export interface Hydra {
  on: (
    pattern: URLPatternInput,
    fn: (request: Request) => Response | void | Promise<Response | void>,
  ) => void;
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
