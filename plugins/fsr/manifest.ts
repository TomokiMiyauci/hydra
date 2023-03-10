import { toFileUrl, walk } from "../../deps.ts";
import { WalkOptions } from "../../utils.ts";
import type { Resource } from "./types.ts";

export async function generate(
  outputPath: string,
  resource: Resource,
): Promise<void> {
  const { pages } = resource;

  const output = `// DO NOT EDIT. This file is generated by hydra.
  // This file SHOULD be checked into source version control.
  
  ${
    pages.map((file, i) => `import * as $${i} from "./pages${file}";`).join(
      "\n",
    )
  }  
  const manifest = {
    pages: {
      ${
    pages.map((file, i) => `${JSON.stringify(file)}: $${i},`)
      .join("\n    ")
  }
    }
  };
  
  export default manifest;
  `;

  const proc = Deno.run({
    cmd: [Deno.execPath(), "fmt", "-"],
    stdin: "piped",
    stdout: "piped",
    stderr: "null",
  });
  const raw = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(output));
      controller.close();
    },
  });
  await raw.pipeTo(proc.stdin.writable);
  const out = await proc.output();
  await proc.status();
  proc.close();

  const manifestStr = new TextDecoder().decode(out);

  await Deno.writeTextFile(outputPath, manifestStr);
  console.log(
    `%cThe manifest has been generated for ${pages.length} pages.`,
    "color: blue; font-weight: bold",
  );
}

const extensions = ["tsx", "ts", "js", "jsx"];

export async function collect(dir: string): Promise<Resource> {
  const pages: string[] = [];
  try {
    const routesUrl = toFileUrl(dir);
    const routesFolder = walk(dir, {
      ...WalkOptions,
      exts: extensions,
    });
    for await (const entry of routesFolder) {
      if (entry.isFile) {
        const file = toFileUrl(entry.path).href.substring(
          routesUrl.href.length,
        );
        pages.push(file);
      }
    }
  } catch (err) {
    throw err;
  }
  pages.sort();

  return { pages };
}

export function equal(left: Resource, right: Resource): boolean {
  return equalArray(left.pages, right.pages);
}

function equalArray<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
