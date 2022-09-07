/** Fetch and merge all copies */
export async function fetchCopies(
  ...urls: string[]
): Promise<Record<string, string>> {
  const copies: Record<string, string> = {};

  for (const url of urls.filter((url) => url)) {
    // Use a proxy to avoid CORS errors
    const requestUrl = new URL("https://google-sheet.mktgoo.workers.dev/");
    requestUrl.searchParams.set("url", normalizeUrl(url));

    const response = await fetch(requestUrl);
    const text = await response.text();

    Object.assign(copies, parseTSV(text));
  }

  return copies;
}

/** Normalize the Google Spreadsheet URL */
function normalizeUrl(url: string): string {
  return url.replace(/\/(pubhtml|pub\?output=\w+)$/, "/pub?output=tsv");
}

/** Parse TSV */
function parseTSV(text: string): Record<string, string> {
  const copies: Record<string, string> = {};

  text.split("\n").forEach((line) => {
    const [key, copy] = line.split("\t", 2);

    if (key && copy) {
      copies[key.trim()] = copy.trim();
    }
  });

  return copies;
}
