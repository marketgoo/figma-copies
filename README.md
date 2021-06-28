# Figma copies by marketgoo

## Development

```sh
npm install -g typescript
npm install
npm start
```

## Usage

1. Create a Google Spreadsheet document with two columns. One for the copy id
   and other for the text.
2. Publish the document to web, and copy the url of the `.tsv`.
3. Run the plugin in Figma and paste the `.tsv` url.
4. All text layers with the same name of any copy id will be updated with the
   copy text.

### Other features:

- If the text contains a `{{ varname }}` pattern, you can replace this variable
  with a value
- If the text contains any html code, like `Hello <strong>world</strong>`, it
  will be used to maintain the multiple styles in the same layer.
