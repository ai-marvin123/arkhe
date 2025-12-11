import { useState, useEffect } from "react";
import MermaidRenderer from "./MermaidRenderer";
import type { DiagramEntry } from "../../state/diagramTypes";
import ViewTools from "../controls/ViewTools";
import { postDiagramToSave } from "../../utils/vsCodeApi";
import SaveButton from "../controls/viewNavigation/SaveButton";

interface diagramFrameType {
  sessionId: string;
  logKey: string;
  entry: DiagramEntry;
}
//declare interface text and key - IMPORT TYPE DIAGRAMENTRY FROM DIAGRAMTYPES FILE - PASS ENTRY AS PROP, PROP IS GONNA HAVE THAT

export default function DiagramFrame({
  sessionId,
  entry,
  logKey,
}: diagramFrameType) {
  const diagram = entry.diagramData?.mermaidSyntax;
  const isFullscreen = entry.viewSettings?.isFullscreen;
  const [saveStatus, setSaveStatus] = useState<string>("idle");
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

  const handleSave = async () => {
    if (saveStatus === "saving") return;
    if (!entry || !entry.diagramData) return null;

    const { diagramData } = entry;

    setSaveStatus("saving");

    try {
      const response = await postDiagramToSave(sessionId, diagramData);
      if (response.command === "AI_RESPONSE") {
        if (response.payload.type === "DIAGRAM_SAVED") {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 3000);
        } else {
          setSaveStatus("error");
          console.error("save failed"); //change this line later so user sees different feedback
        }
      } else if (response.command === "ERROR") {
        setSaveStatus("error");
        console.error("Backend Error:", response.payload.message);
      }
    } catch (error) {
      setSaveStatus("error");
      throw new Error(`there was an error while saving diagram, ${error}`);
    }
  };

  const content = (
    <div
      key={logKey}
      style={{ padding: wrapperPadding }}
      className={`${panelClasses}
        w-full max-w-full 
        bg-gray-900 border border-gray-700 
        rounded-lg p-3
        relative
        overflow-hidden
      `}>
      <SaveButton clickFunc={handleSave} status={saveStatus} />
      <MermaidRenderer
        logKey={logKey}
        code={diagram}
        view={entry.viewSettings}
      />
      {/* {entry.viewSettings?.isAIOpen && (
        <div className="bg-gray-800 text-white p-3 mt-3 rounded border border-gray-700">
          <h3 className="font-semibold mb-1">AI Message</h3>
          <p>{entry.text}</p>
        </div>
      )} */}
      {/* <pre
        style={{
          background: '#222',
          color: '#0f0',
          padding: '10px',
          marginTop: '20px',
        }}
      >
        {JSON.stringify(entry.diagramData?.jsonStructure, null, 2)}
      </pre> */}
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
