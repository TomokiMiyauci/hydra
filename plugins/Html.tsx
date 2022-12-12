export interface HtmlProps {
  readonly content: string;
}

export default function Html(props: HtmlProps) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body
        dangerouslySetInnerHTML={{ __html: props.content }}
      />
    </html>
  );
}
