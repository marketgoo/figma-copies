import { emit, on, showUI } from "@create-figma-plugin/utilities";
import { SourceCopies } from "./types";
import { getTextNodes } from "./utils";

export default function () {
  showUI({
    height: 400,
    width: 500,
  });

  // Get the nodes from the selection or the whole document
  const selection = figma.currentPage.selection.slice();
  const textNodes = selection.length
    ? getTextNodes(selection)
    : figma.currentPage.findAll((node) => node.type === "TEXT") as TextNode[];

  if (!textNodes.length) {
    emit("COMPLETED", {
      title: selection.length
        ? "No text nodes found in the selection"
        : "No text nodes found in the document",
    });
  } else {
    // Send document defaults
    emit("DEFAULTS", {
      url: figma.root.getPluginData("url"),
      url_2: figma.root.getPluginData("url_2"),
      url_3: figma.root.getPluginData("url_3"),
    });
  }

  // The copies have been loaded
  on("FETCHED_COPIES", (data: SourceCopies) => {
    // Save document urls defaults
    figma.root.setPluginData("url", data.url);
    figma.root.setPluginData("url_2", data.url_2);
    figma.root.setPluginData("url_3", data.url_3);

    // Search and replace the text nodes with the copies
    const nodes = getUntranslatedNodes(textNodes, data.copies);

    if (nodes.length) {
      // Update the copies
      emit("UNTRANSLATED", { nodes });
    } else {
      const title = selection.length
        ? "No missing copies found in the selection"
        : "No missing copies found in the document";
      emit("COMPLETED", { title });
    }
  });
}

// Select a text node
on("SELECT_NODE", (data: { node: { id: string } }) => {
  const node = figma.currentPage.findOne((node) =>
    node.id === data.node.id
  ) as TextNode;
  if (node) {
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  }
});

// Close the plugin when the UI is closed
on("CLOSE", () => figma.closePlugin());

/** Filter all TextNodes without translations */
function getUntranslatedNodes(
  nodes: TextNode[],
  copies: Record<string, string>,
): [string, string, string][] {
  return nodes.filter((node) => !(node.name in copies)).map((
    node,
  ) => [node.name, node.characters, node.id]);
}
