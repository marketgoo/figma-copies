import { Button, MiddleAlign } from "@create-figma-plugin/ui";
import { h } from "preact";

interface Props {
  title: string;
  onSubmit: () => void;
}

export default function Completed({ title, onSubmit }: Props) {
  return (
    <MiddleAlign>
      <div class="center">
        <p>{title}</p>
        <Button onClick={onSubmit}>Close</Button>
      </div>
    </MiddleAlign>
  );
}
