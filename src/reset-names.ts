import { getTextNodes } from "./utils";

export default function () {
  const selection = figma.currentPage.selection.slice();
  const textNodes = selection.length
    ? getTextNodes(selection)
    : figma.currentPage.findAll((node) => node.type === "TEXT") as TextNode[];

  textNodes.forEach((node) => node.name = "");
  figma.closePlugin();
}
