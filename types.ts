export interface Hooks {
  on: (
    pattern: URLPatternInput,
    fn: (request: Request) => Response | void | Promise<Response | void>,
  ) => void;

  onTransform: TransformHook;
}

export interface Transform {
  (input: string): string | Promise<string>;
}

export interface TransformHook {
  (contentType: RegExp | string, transform: Transform): void;
}

export interface Setup {
  (hooks: Hooks, context: Context): void | Promise<void>;
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

export interface Config {
  plugins: Iterable<Plugin>;

  /**
   * @default import.meta.url
   */
  baseUrl?: string;

  /**
   * @default true
   */
  isProd?: boolean;
}
