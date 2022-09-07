import {
  Button,
  IconButton,
  IconPlus32,
  Inline,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { h } from "preact";

interface Props {
  onClose: () => void;
  onSelectNode: (data: any) => void;
  nodes: [string, string, string][];
}

export default function VariablesForm(
  { nodes, onSelectNode, onClose }: Props,
) {
  nodes.sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <VerticalSpace space="large" />
      <Text>
        The following nodes are missing in the Google Spreadsheet document:
      </Text>
      <VerticalSpace space="extraLarge" />

      <table class="table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Text</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, index) => (
            <tr>
              <td>{node[0]}</td>
              <td>{node[1]}</td>
              <IconButton
                type="button"
                onClick={() => onSelectNode({ node: { id: node[2] } })}
              >
                <IconPlus32 />
              </IconButton>
            </tr>
          ))}
        </tbody>
      </table>

      <VerticalSpace space="large" />

      <Inline space="extraSmall">
        <Button onClick={onClose}>Close</Button>
      </Inline>
      <VerticalSpace space="small" />
    </div>
  );
}
