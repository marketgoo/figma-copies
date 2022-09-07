import { emit, on, showUI } from "@create-figma-plugin/utilities";
import { NodeInfo, ResizeWindowHandler, SourceCopies } from "./types";
import { getTextNodes, updateNodeCopy } from "./utils";

export default function () {
  on<ResizeWindowHandler>(
    "RESIZE_WINDOW",
    (windowSize: { width: number; height: number }) => {
      const { width, height } = windowSize;
      figma.ui.resize(width, height);
    },
  );
  showUI({
    height: 400,
    width: 500,
  });

  // List of Nodes with copies
  let nodes: NodeInfo[] = [];

  // Send document defaults
  emit("DEFAULTS", {
    url: figma.root.getPluginData("url"),
    url_2: figma.root.getPluginData("url_2"),
    url_3: figma.root.getPluginData("url_3"),
  });

  // The copies have been loaded
  on("FETCHED_COPIES", (data: SourceCopies) => {
    // Save document urls defaults
    figma.root.setPluginData("url", data.url);
    figma.root.setPluginData("url_2", data.url_2);
    figma.root.setPluginData("url_3", data.url_3);

    // Get the nodes from the selection or the whole document
    const selection = figma.currentPage.selection.slice();
    const textNodes = selection.length
      ? getTextNodes(selection)
      : figma.currentPage.findAll((node) => node.type === "TEXT") as TextNode[];

    // Search and replace the text nodes with the copies
    nodes = getCopiesNodes(textNodes, data.copies);

    // If some variables has been found, show the variables panel
    const requiredInfo = nodes.filter((node) => Object.keys(node.vars).length);

    if (requiredInfo.length) {
      emit("REQUIRE_VARS", { nodes: requiredInfo });
    } else {
      // Update the copies
      updateCopies(nodes);
    }
  });

  // Select a text node
  on("SELECT_NODE", (data: NodeInfo) => {
    const node = figma.currentPage.findOne((node) =>
      node.id === data.node.id
    ) as TextNode;
    if (node) {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  });

  // Update the variables
  on("UPDATE_VARS", (data: NodeInfo[]) => {
    data.forEach((info) => {
      const node = nodes.find((node) => node.node.id === info.node.id);
      if (node) {
        node.vars = info.vars;
        Object.entries(node.vars).forEach(([name, value]) => {
          node.node.setPluginData(name, value);
        });
      }
    });

    // Update the copies
    updateCopies(nodes);
  });
}

// Close the plugin when the UI is closed
on("CLOSE", () => figma.closePlugin());

/** Filter all TextNodes with translations and update the copies */
function getCopiesNodes(
  nodes: TextNode[],
  copies: Record<string, string>,
): NodeInfo[] {
  nodes = nodes.filter((node) => (node.name in copies));
  return nodes.map((node: TextNode) => getInfo(node, copies[node.name]));
}

/** Get the node info */
function getInfo(node: TextNode, copy: string): NodeInfo {
  const info: NodeInfo = {
    name: node.name,
    oldCopy: node.characters,
    copy,
    vars: {},
    node,
  };

  const matches = copy.matchAll(/\{\{\s*([^\}]+)\s*\}\}/g);

  for (const [_, name] of matches) {
    info.vars[name] = node.getPluginData(name).trim();
  }

  return info;
}

/** Update the text nodes with the new copies */
async function updateCopies(nodes: NodeInfo[]): Promise<void> {
  try {
    Promise.all(
      nodes.map(({ node, copy, vars }) => updateNodeCopy(node, copy, vars)),
    );
    emit("COMPLETED");
  } catch (err) {
    console.error(err);
  }
}
