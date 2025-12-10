import { useEffect } from "react";
import MermaidRenderer from "./MermaidRenderer";
import type { DiagramEntry } from "../../state/diagramTypes";
import ViewTools from "../controls/ViewTools";
import { useDiagramDispatch } from "../../state/diagramContext";

interface diagramFrameType {
  logKey: string;
  entry: DiagramEntry;
}
//declare interface text and key - IMPORT TYPE DIAGRAMENTRY FROM DIAGRAMTYPES FILE - PASS ENTRY AS PROP, PROP IS GONNA HAVE THAT

export default function DiagramFrame({ entry, logKey }: diagramFrameType) {
  const diagram = entry.diagramData?.mermaidSyntax;
  const isFullscreen = entry.viewSettings?.isFullscreen;
  const dispatch = useDiagramDispatch();
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

  const panelClasses =
    "relative w-full max-w-full bg-gray-900 border border-gray-700 rounded-lg p-5 overflow-hidden shadow-2xl";

  if (diagram === undefined) {
    return;
  }

  const handleExitFullscreen = () => {
    dispatch({
      type: "update_logEntry",
      payload: { id: entry.id, isFullscreen: false },
    });
  };

  const content = (
    <div key={logKey} style={{ padding: "20px" }} className={panelClasses}>
      {isFullscreen && (
        <button
          type="button"
          onClick={handleExitFullscreen}
          className="absolute top-3 right-3 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded px-3 py-1 text-sm">
          Close
        </button>
      )}
      <MermaidRenderer
        logKey={logKey}
        code={diagram}
        view={entry.viewSettings}
      />

      {/* style={{ padding: "20px" }} */}
      <ViewTools id={entry.id} view={entry.viewSettings} />
      <div className="mt-3 rounded-lg border border-slate-800 bg-[#1b1f2b] text-slate-50 px-4 py-3 w-fit max-w-full">
        <button
          type="button"
          className="w-full flex items-center justify-between font-semibold text-left text-slate-100"
          onClick={() =>
            dispatch({
              type: "update_logEntry",
              payload: {
                id: entry.id,
                isAIOpen: !entry.viewSettings?.isAIOpen,
              },
            })
          }>
          <span className="inline-flex items-center gap-2">AI Message</span>
          <span className="text-base">
            {entry.viewSettings?.isAIOpen ? "▾" : "▸"}
          </span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 flex justify-start ${
            entry.viewSettings?.isAIOpen ? "max-h-72 mt-3" : "max-h-0"
          }`}>
          {entry.viewSettings?.isAIOpen && (
            <div className="bg-[#111322] border border-[#22253a] rounded-lg px-3 py-2 text-sm leading-relaxed w-fit max-w-[70%] text-left">
              <p className="font-semibold mb-1 text-slate-100">AI Message</p>
              <p className="text-slate-200">{entry.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isFullscreen) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c152b] text-white overflow-auto p-8 flex justify-center items-center">
      <div className="max-w-5xl w-full">{content}</div>
    </div>
  );
}
