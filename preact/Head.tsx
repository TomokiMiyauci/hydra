import { type ComponentChildren, createContext, useContext } from "../deps.ts";

export interface HeadProps {
  readonly children: ComponentChildren;
}

export const HEAD_CONTEXT = createContext<ComponentChildren[]>([]);

export function Head(props: HeadProps): null {
  const context = useContext(HEAD_CONTEXT);

  context.push(props.children);
  return null;
}
