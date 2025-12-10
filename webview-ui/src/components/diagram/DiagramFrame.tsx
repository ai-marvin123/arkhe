import { useEffect } from "react";
import MermaidRenderer from "./MermaidRenderer";
import type { DiagramEntry } from "../../state/diagramTypes";
import ViewTools from "../controls/ViewTools";

interface diagramFrameType {
  logKey: string;
  entry: DiagramEntry;
}
//declare interface text and key - IMPORT TYPE DIAGRAMENTRY FROM DIAGRAMTYPES FILE - PASS ENTRY AS PROP, PROP IS GONNA HAVE THAT

export default function DiagramFrame({ entry, logKey }: diagramFrameType) {
  const diagram = entry.diagramData?.mermaidSyntax;
  const isFullscreen = entry.viewSettings?.isFullscreen;
  console.log("🚀Diagram entry text", entry.id, entry.text);

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const panelClasses = `relative w-full max-w-full bg-gray-900 border border-gray-700 rounded-lg p-5 overflow-hidden shadow-2xl ${
    isFullscreen ? "h-full flex flex-col" : ""
  }`;
  const wrapperPadding = isFullscreen ? "0px" : "20px";

  if (diagram === undefined) {
    return;
  }

  const content = (
    <div
      key={logKey}
      style={{ padding: wrapperPadding }}
      className={panelClasses}>
      <MermaidRenderer
        logKey={logKey}
        code={diagram}
        view={entry.viewSettings}
      />

      {/* style={{ padding: "20px" }} */}
      <ViewTools id={entry.id} view={entry.viewSettings} />
    </div>
  );

  if (!isFullscreen) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c152b] text-white overflow-hidden p-6 flex">
      <div className="w-full h-full">{content}</div>
    </div>
  );
}
