figma.showUI(__html__);

figma.ui.onmessage = async msg => {
  switch (msg.type) {
    case 'update':
      await updateCopies(msg);
      break;
  }

  figma.closePlugin();
};

async function updateCopies(msg) {
  const { copies } = msg;
  const textNodes = figma.root.findAll((node) => node.type === "TEXT");

  for (const node of textNodes) {
    if (node.type !== "TEXT") {
      continue;
    }

    const { name } = node;

    if (!(name in copies)) {
      continue;
    }

    const ranges = getRanges(node, copies[name])
    ranges.forEach(async ({start, end, fontName, newCopy}) => {
      await figma.loadFontAsync(fontName as FontName);

      node.insertCharacters(start, newCopy, "AFTER");
      node.deleteCharacters(start + newCopy.length, end + newCopy.length);
      console.log({start, end, newCopy});
    })
  }
}

function getRanges(node, copy) {
  const nodeRanges = getNodeRanges(node);
  const copyRanges = getCopyRanges(copy);

  if (nodeRanges.length > copyRanges.length) {
    nodeRanges.splice(copyRanges.length);
  } else if (nodeRanges < copyRanges.length) {
    const index = Math.max(0, nodeRanges.length - 1);
    const last = copyRanges.splice(index).join("");
    copyRanges.push(last);
  }

  nodeRanges.reverse();
  copyRanges.reverse();

  let end = node.characters.length;

  return nodeRanges.map((range, index) => {
    range.newCopy = copyRanges[index];
    range.end = end;
    end = range.start;
    return range;
  });
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
      ranges.push({start, fontName});
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

  return [fontName, JSON.stringify([fontSize, fontName, textCase, textDecoration, fills])];
}

function getCopyRanges(html) {
  const ranges = html.split(/<[^>]+>/).filter((value) => value !== "");
  return ranges;
}
