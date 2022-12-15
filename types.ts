export interface Hydra {
  on: (
    pattern: URLPatternInput,
    fn: (request: Request) => Response | void | Promise<Response | void>,
  ) => void;

  onTransform: Transformer;
}

export interface Transform {
  (input: string): string;
}

export interface Transformer {
  (contentType: RegExp | string, transform: Transform): void;
}

export interface Setup {
  (instance: Hydra, context: Context): void | Promise<void>;
}

export interface Plugin {
  readonly name: string;
  readonly setup: Setup;
}

export interface Handler {
  (request: Request): Response | Promise<Response>;
}

export interface Context {
  /** Whether the environment is production or not. */
  readonly isProduction: boolean;

  readonly rootDir: string;
}
