let nodes: TextNode[];

const selection = figma.currentPage.selection.slice();

if (selection.length) {
  nodes = getTextNodes(selection);
} else {
  nodes = figma.root.findAll((node) => node.type === "TEXT") as TextNode[];
}

let nodeInfo: Info[];

interface Info {
  name: string;
  oldCopy: string;
  copy: string;
  vars: { [index: string]: string };
  node: TextNode;
}

figma.showUI(__html__, {
  width: 500,
  height: 500,
});

// Send document
figma.ui.postMessage({
  type: "url",
  url: figma.root.getPluginData("url"),
});

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "update":
      figma.root.setPluginData("url", msg.url);
      await searchCopies(msg);
      break;
    case "info":
      await updateInfo(msg);
      break;
    case "cancel":
      figma.closePlugin();
      break;
  }
};

async function searchCopies(msg) {
  const { copies } = msg;
  nodes = nodes.filter((node) => (node.name in copies));
  nodeInfo = nodes.map((node: TextNode) => getInfo(node, copies[node.name]));

  const requiredInfo = nodeInfo.filter((info) => Object.keys(info.vars));

  if (requiredInfo.length) {
    figma.showUI(__html__);

    figma.ui.postMessage({
      type: "info",
      nodes: requiredInfo,
    });
  } else {
    await updateCopies();
  }
}

async function updateCopies() {
  for (const { node, copy, vars } of nodeInfo) {
    try {
      const newCopy = copy.replaceAll(
        /\{\{\s*([^\}]+)\s*\}\}/g,
        (match, name) => vars[name] || match,
      );
      const [ranges, fontNames] = getRanges(node, newCopy);

      await Promise.all(
        fontNames.map((fontName) => figma.loadFontAsync(fontName)),
      );

      for (const { start, end, fontName, newCopy } of ranges) {
        node.insertCharacters(start, newCopy, "AFTER");
        node.deleteCharacters(start + newCopy.length, end + newCopy.length);
      }
    } catch (error) {
      return figma.ui.postMessage({
        type: "error",
        message: error.message,
        node: node.name,
        copy: copy,
      });
    }
  }

  figma.closePlugin();
}

async function updateInfo(msg) {
  for (const [id, value] of msg.entries) {
    const [nodeId, name] = id.split("-");
    const node = nodeInfo.find((info) => info.node.id === nodeId);

    if (node) {
      node.node.setPluginData(name, value);
      node.vars[name] = value;
    }
  }

  await updateCopies();
}

function getInfo(node: TextNode, copy: string) {
  const info = {
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

function getRanges(node, copy) {
  const nodeRanges = getNodeRanges(node);
  const copyRanges = getCopyRanges(copy);
  const fontNames = new Set(nodeRanges.map((range) => range.fontName));

  if (nodeRanges.length > copyRanges.length) {
    nodeRanges.splice(copyRanges.length);
  } else if (nodeRanges.length < copyRanges.length) {
    const index = Math.max(0, nodeRanges.length - 1);
    const last = copyRanges.splice(index).join("");
    copyRanges.push(last);
  }

  nodeRanges.reverse();
  copyRanges.reverse();

  let end = node.characters.length;

  const ranges = nodeRanges.map((range, index) => {
    range.newCopy = copyRanges[index];
    range.end = end;
    end = range.start;
    return range;
  });

  return [ranges, [...fontNames]];
}

function getNodeRanges(node) {
  const ranges = [];
  const total = node.characters.length;
  let start = 0;
  let latest;

  while (start < total) {
    const [fontName, id] = getChartStyle(node, start);
    if (id !== latest) {
      latest = id;
      ranges.push({ start, fontName });
    }
    ++start;
  }

  return ranges;
}

function getChartStyle(node, index) {
  const fontSize = node.getRangeFontSize(index, index + 1);
  const fontName = node.getRangeFontName(index, index + 1);
  const textCase = node.getRangeTextCase(index, index + 1);
  const textDecoration = node.getRangeTextDecoration(index, index + 1);
  const fills = node.getRangeFills(index, index + 1);

  return [
    fontName,
    JSON.stringify([fontSize, fontName, textCase, textDecoration, fills]),
  ];
}

function getCopyRanges(html) {
  return html
    .replaceAll(/\s*(<br \/>|<br>)\s*/g, "\n")
    .split(/<[^>]+>/)
    .filter((value) => value !== "");
}

function getTextNodes(nodes: (PageNode | SceneNode)[]): TextNode[] {
  return nodes.reduce((result, node) => {
    if (node.type === "TEXT") {
      result.push(node);
    } else if ("children" in node && Array.isArray(node.children)) {
      const children = getTextNodes(node.children);
      if (children.length > 0) {
        result.push(...children);
      }
    }
    return result;
  }, []);
}
