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

  const baseClasses = `
  relative
        w-full max-w-full å
        bg-gray-900 border border-gray-700 
        rounded-lg p-3
      `;

  const fullscreenClasses = `
  relative
        fixed inset-0 z-[9999] 
        bg-gray-900 overflow-auto 
        p-6
      `;
  if (diagram === undefined) {
    return;
  }

  return (
    <div
      key={logKey}
      style={{ padding: '20px' }}
      className='
        w-full max-w-full 
        bg-gray-900 border border-gray-700 
        rounded-lg p-3
        relative
        overflow-hidden
      '
    >
      <MermaidRenderer
        logKey={logKey}
        code={diagram}
        view={entry.viewSettings}
      />

      style={{ padding: "20px" }}
      className={isFullscreen ? fullscreenClasses : baseClasses}>
      <MermaidRenderer code={diagram} />
      {entry.viewSettings?.isAIOpen && (
        <div className="bg-gray-800 text-white p-3 mt-3 rounded border border-gray-700">
          <h3 className="font-semibold mb-1">AI Message</h3>
          <p>{entry.text}</p>
        </div>
      )}
      <pre
        style={{
          background: "#222",
          color: "#0f0",
          padding: "10px",
          marginTop: "20px",
        }}>
        {JSON.stringify(entry.diagramData?.jsonStructure, null, 2)}
      </pre>
      <ViewTools id={entry.id} view={entry.viewSettings} />
    </div>
  );
}
