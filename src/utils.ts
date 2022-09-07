/** Reset the name of a Node */
export function resetName(node: TextNode) {
}

/** Search all TextNodes */
export function getTextNodes(nodes: BaseNode[]): TextNode[] {
  const result: TextNode[] = [];

  nodes.forEach((node) => {
    if (node.type === "TEXT") {
      result.push(node as TextNode);
    } else if ("children" in node && Array.isArray(node.children)) {
      const children = getTextNodes(node.children);
      if (children.length > 0) {
        result.push(...children);
      }
    }
  });

  return result;
}

/** Update the text of a Node */
export async function updateNodeCopy(
  node: TextNode,
  copy: string,
  vars: Record<string, string>,
): Promise<void> {
  const newCopy = copy.replaceAll(
    /\{\{\s*([^\}]+)\s*\}\}/g,
    (match: string, name: string) => vars[name] || match,
  );
  const [ranges, fontNames] = getRanges(node, newCopy);

  await Promise.all(
    fontNames.map((fontName) => figma.loadFontAsync(fontName)),
  );

  for (const { start, end, fontName, newCopy } of ranges) {
    node.insertCharacters(start, newCopy, "AFTER");
    node.deleteCharacters(start + newCopy.length, end + newCopy.length);
  }
}

/** Get the text ranges to update */
function getRanges(node: TextNode, copy: string): [CopyRange[], FontName[]] {
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

  const ranges: CopyRange[] = nodeRanges.map((range, index) => {
    const copyRange: CopyRange = {
      ...range,
      newCopy: copyRanges[index],
      end,
    };

    end = range.start;
    return copyRange;
  });

  return [ranges, [...fontNames]];
}

interface NodeRange {
  start: number;
  fontName: FontName;
}
interface CopyRange extends NodeRange {
  newCopy: string;
  end: number;
}

/** Get the text ranges according with the different styles */
function getNodeRanges(node: TextNode): NodeRange[] {
  const ranges: NodeRange[] = [];
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

/** Get the style of a character */
function getChartStyle(node: TextNode, index: number): [FontName, string] {
  const fontSize = node.getRangeFontSize(index, index + 1);
  const fontName = node.getRangeFontName(index, index + 1) as FontName;
  const textCase = node.getRangeTextCase(index, index + 1);
  const textDecoration = node.getRangeTextDecoration(index, index + 1);
  const fills = node.getRangeFills(index, index + 1);

  return [
    fontName,
    JSON.stringify([fontSize, fontName, textCase, textDecoration, fills]),
  ];
}

/** Get the ranges according to html tags */
function getCopyRanges(html: string): string[] {
  return html
    .replaceAll(/\s*(<br \/>|<br>)\s*/g, "\n")
    .split(/<[^>]+>/)
    .filter((value: string) => value !== "");
}
