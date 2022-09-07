import {
  Button,
  IconButton,
  IconPlus32,
  Inline,
  Stack,
  Text,
  Textbox,
  Toggle,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { useState } from "preact/hooks";
import { h } from "preact";

import type { NodeInfo } from "../types";

interface Props {
  onSubmit: (data: NodeInfo[]) => void;
  onSelectNode: (data: NodeInfo) => void;
  nodes: NodeInfo[];
}

export default function VariablesForm(
  { nodes, onSubmit, onSelectNode }: Props,
) {
  const [filterEmpty, setFilterEmpty] = useState<boolean>(false);

  nodes.sort((a, b) => a.copy.localeCompare(b.copy));

  if (filterEmpty) {
    nodes = nodes.filter((node) =>
      Object.values(node.vars).some((val) => !val)
    );
  }

  function handleSubmitForm(ev: Event) {
    ev.preventDefault();

    new FormData(ev.target as HTMLFormElement).forEach((value, key) => {
      const [id, name] = key.split("-");
      const node = nodes.find((node) => node.node.id === id);
      if (node) {
        node.vars[name] = (value as string).trim();
      }
    });

    onSubmit(nodes);
  }

  return (
    <form onSubmit={handleSubmitForm}>
      <VerticalSpace space="large" />
      <Text>Update the dynamic variables of your copies:</Text>
      <VerticalSpace space="small" />
      <Inline space="extraSmall">
        <Toggle
          value={filterEmpty}
          onChange={(ev) => setFilterEmpty(ev.currentTarget.checked)}
        >
          <Text>Only empty variables</Text>
        </Toggle>
      </Inline>
      <VerticalSpace space="extraLarge" />

      <Stack space="large">
        {nodes.map((node, index) => (
          <div class="labelVariable">
            <div class="labelVariable-text">
              <label for={"node-" + index + "-0"}>
                <Text>{node.copy}</Text>
              </label>
              <IconButton type="button" onClick={() => onSelectNode(node)}>
                <IconPlus32 />
              </IconButton>
            </div>
            <Inline space="extraSmall">
              {Object.entries(node.vars).map(([name, value], i) => (
                <Textbox
                  name={node.node.id + "-" + name}
                  id={"node-" + index + "-" + i}
                  value={value}
                  variant="border"
                  placeholder={name.trim()}
                />
              ))}
            </Inline>
          </div>
        ))}
      </Stack>

      <VerticalSpace space="large" />

      <Inline space="extraSmall">
        <Button>Update</Button>
      </Inline>
      <VerticalSpace space="small" />
    </form>
  );
}
