import { JSX } from "../deps.ts";
import type { HtmlProps } from "../plugins/fsr/types.ts";

export default function Html(props: HtmlProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {props.HeadChildren}
      </head>

      <body
        dangerouslySetInnerHTML={{
          __html: props.bodyHtml,
        }}
      >
      </body>
    </html>
  );
}
