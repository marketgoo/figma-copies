import {
  Button,
  Disclosure,
  Inline,
  Text,
  Textbox,
  useForm,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { h } from "preact";
import { useState } from "preact/hooks";

import type { SourceUrls } from "../types";

interface Props extends SourceUrls {
  onSubmit: (data: SourceUrls) => void;
}

export default function SourceForm({ url, url_2, url_3, onSubmit }: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const { disabled, formState, handleSubmit, initialFocus, setFormState } =
    useForm<SourceUrls>(
      { url, url_2, url_3 },
      {
        close() {},
        submit(formState: SourceUrls) {
          onSubmit(formState);
          return false;
        },
      },
    );

  function handleSubmitForm(ev: Event) {
    ev.preventDefault();
    handleSubmit();
  }

  return (
    <form onSubmit={handleSubmitForm}>
      <VerticalSpace space="large" />
      <Text>
        In your Google Spreadsheet document, go to File &gt; Share &gt; Publish
        to the web. Enable it and copy the URL.
      </Text>
      <VerticalSpace space="small" />
      <Textbox
        {...initialFocus}
        name="url"
        onValueInput={setFormState}
        value={formState.url}
        variant="border"
        required
        placeholder="The public URL of a Google Spreadsheet document"
      />
      <VerticalSpace space="small" />
      <Disclosure
        title="Additional documents"
        open={open}
        onClick={() => setOpen(!(open === true))}
      >
        <Text>
          You can add additional Spreadsheet documents. The copies will be
          merged with the main document.
        </Text>
        <VerticalSpace space="small" />
        <Textbox
          name="url_2"
          onValueInput={setFormState}
          value={formState.url_2}
          variant="border"
          placeholder="The public URL of a Google Spreadsheet document"
        />
        <Textbox
          name="url_3"
          onValueInput={setFormState}
          value={formState.url_3}
          variant="border"
          placeholder="The public URL of a Google Spreadsheet document"
        />
      </Disclosure>

      <VerticalSpace space="small" />
      <Inline space="extraSmall">
        <Button disabled={disabled === true}>Update</Button>
      </Inline>
      <VerticalSpace space="small" />
    </form>
  );
}
