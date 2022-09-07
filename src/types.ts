import { EventHandler } from "@create-figma-plugin/utilities";

export interface ResizeWindowHandler extends EventHandler {
  name: "RESIZE_WINDOW";
  handler: (windowSize: { width: number; height: number }) => void;
}

export interface SourceUrls {
  url: string;
  url_2: string;
  url_3: string;
}

export interface SourceCopies extends SourceUrls {
  copies: Record<string, string>;
}

export interface NodeInfo {
  name: string;
  oldCopy: string;
  copy: string;
  vars: Record<string, string>;
  node: TextNode;
}
