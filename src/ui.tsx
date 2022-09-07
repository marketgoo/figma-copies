import {
  Container,
  IconCheckCircle32,
  LoadingIndicator,
  MiddleAlign,
  render,
  useWindowResize,
} from "@create-figma-plugin/ui";
import { h } from "preact";
import { useState } from "preact/hooks";
import { emit, on } from "@create-figma-plugin/utilities";
import { fetchCopies } from "./ui/utils";
import SourceForm from "./ui/source-form";
import VariablesForm from "./ui/variables-form";
import Completed from "./ui/completed";
import MissingCopies from "./ui/missing-copies";
import "!./ui/styles.css";

import type { NodeInfo, ResizeWindowHandler, SourceUrls } from "./types";

function Plugin() {
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit<ResizeWindowHandler>("RESIZE_WINDOW", windowSize);
  }
  useWindowResize(onWindowResize, {
    maxHeight: 800,
    maxWidth: 500,
    minHeight: 120,
    minWidth: 250,
    resizeBehaviorOnDoubleClick: "minimize",
  });

  return <Main />;
}

export default render(Plugin);

interface State {
  type: string;
  data: any;
}

function Main() {
  const [state, setState] = useState<State>({
    type: "loading",
    data: { title: "Loading..." },
  });

  on("DEFAULTS", (data) => {
    setState({ type: "defaults", data });
  });

  on("REQUIRE_VARS", (data) => {
    setState({ type: "variables", data });
  });

  on("COMPLETED", (data) => {
    setState({
      type: "completed",
      data: { title: data.title },
    });
  });

  on("UNTRANSLATED", (data) => {
    setState({
      type: "untranslated",
      data: { nodes: data.nodes },
    });
  });

  async function handleSubmitUrls(data: SourceUrls) {
    setState({ type: "loading", data: { title: "Loading copies..." } });
    const copies = await fetchCopies(...Object.values(data));
    setState({
      type: "loading",
      data: { title: "Matching copies in the document..." },
    });
    emit("FETCHED_COPIES", { ...data, copies });
  }

  function handleSelectNode(node: NodeInfo) {
    emit("SELECT_NODE", node);
  }

  function handleCompleted() {
    emit("CLOSE");
  }

  async function handleSubmitVars(nodes: NodeInfo[]) {
    setState({ type: "loading", data: { title: "Updating copies..." } });
    emit("UPDATE_VARS", nodes);
  }

  return (
    <Container space="medium">
      {state.type === "defaults" && (
        <SourceForm {...state.data as SourceUrls} onSubmit={handleSubmitUrls} />
      )}
      {state.type === "variables" && (
        <VariablesForm
          {...state.data as { nodes: NodeInfo[] }}
          onSelectNode={handleSelectNode}
          onSubmit={handleSubmitVars}
        />
      )}
      {state.type === "loading" && (
        <MiddleAlign>
          <LoadingIndicator />
          {state.data.title}
        </MiddleAlign>
      )}
      {state.type === "completed" && (
        <Completed title={state.data.title} onSubmit={handleCompleted} />
      )}
      {state.type === "untranslated" && (
        <MissingCopies
          nodes={state.data.nodes}
          onClose={handleCompleted}
          onSelectNode={handleSelectNode}
        />
      )}
    </Container>
  );
}
