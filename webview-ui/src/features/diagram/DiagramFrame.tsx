import { useState, useEffect, useRef } from "react";
import MermaidRenderer from "./MermaidRenderer";
import type { MermaidRendererHandle } from "./MermaidRenderer";
import type { DiagramEntry } from "../../types/diagramTypes";
import ViewTools from "./ViewTools";
import { postDiagramToSave, exportPdf } from "../../shared/utils/vsCodeApi";
import SaveButton from "./viewButtons/SaveButton";
import { jsPDF } from "jspdf";

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
  const [exportStatus, setExportStatus] = useState<string>("idle");
  const mermaidRef = useRef<MermaidRendererHandle>(null);
  // console.log('🚀Diagram entry text', entry.id, entry.text);

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

  const panelClasses = `relative w-full max-w-full min-h-[300px] bg-[#1f1a24] rounded-lg p-5 overflow-hidden shadow-2xl ${
    isFullscreen ? "h-full flex flex-col" : ""
  }`;
  const wrapperPadding = isFullscreen ? "0px" : "20px";

  if (diagram === undefined) {
    return;
  }

  const minSaving = 1000;

  const handleSave = async () => {
    if (saveStatus === "saving") return;
    if (!entry || !entry.diagramData) return null;

    const { diagramData } = entry;

    const startedAt = Date.now();
    setSaveStatus("saving");

    try {
      const response = await postDiagramToSave(sessionId, diagramData);
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minSaving - elapsed);

      if (response.command === "AI_RESPONSE") {
        if (response.payload.type === "DIAGRAM_SAVED") {
          window.setTimeout(() => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);
          }, remaining);
        } else {
          window.setTimeout(() => {
            setSaveStatus("error");
          }, remaining);
        }
      } else if (response.command === "ERROR") {
        window.setTimeout(() => {
          setSaveStatus("error");
        }, remaining);
        console.error("Backend Error:", response.payload.message);
      }
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minSaving - elapsed);

      window.setTimeout(() => {
        setSaveStatus("error");
      }, remaining);
      throw new Error(`there was an error while saving diagram, ${error}`);
    }
  };

  const handleExportPdf = async () => {
    if (exportStatus === "exporting") return;

    const svgElement = mermaidRef.current?.getSvgElement();
    if (!svgElement) {
      console.error("No SVG element found for PDF export.");
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
      return;
    }

    setExportStatus("exporting");

    try {
      // 1. Clone the SVG and ensure it has explicit dimensions
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      const graphicsEl = svgElement as unknown as SVGGraphicsElement;
      const bbox = graphicsEl.getBBox();
      const svgWidth = bbox.width + bbox.x * 2 || svgElement.clientWidth || 800;
      const svgHeight = bbox.height + bbox.y * 2 || svgElement.clientHeight || 600;

      clonedSvg.setAttribute("width", String(svgWidth));
      clonedSvg.setAttribute("height", String(svgHeight));

      // 2. Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);

      // 3. Convert SVG string to a data URL (blob: URLs are blocked by webview CSP)
      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      // 4. Draw SVG onto a canvas
      const img = new Image();
      img.onload = async () => {
        try {
          const scale = 2; // High DPI for crisp PDF output
          const canvas = document.createElement("canvas");
          canvas.width = svgWidth * scale;
          canvas.height = svgHeight * scale;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Could not get canvas 2D context.");
          }

          // Fill with dark background to match the diagram panel
          ctx.fillStyle = "#1f1a24";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

          // 5. Create PDF with jsPDF
          const isLandscape = svgWidth > svgHeight;
          const pdf = new jsPDF({
            orientation: isLandscape ? "landscape" : "portrait",
            unit: "px",
            format: [svgWidth + 40, svgHeight + 40], // 20px padding on each side
          });

          const pngDataUrl = canvas.toDataURL("image/png");
          pdf.addImage(pngDataUrl, "PNG", 20, 20, svgWidth, svgHeight);

          // 6. Get PDF as base64 and send to extension
          const pdfBase64 = pdf.output("datauristring").split(",")[1];
          const fileName = `arkhe-diagram-${Date.now()}.pdf`;

          await exportPdf(pdfBase64, fileName);

          setExportStatus("done");
          setTimeout(() => setExportStatus("idle"), 3000);
        } catch (err) {
          console.error("PDF generation failed:", err);
          setExportStatus("error");
          setTimeout(() => setExportStatus("idle"), 3000);
        }
      };

      img.onerror = () => {
        console.error("Failed to load SVG as image for PDF export.");
        setExportStatus("error");
        setTimeout(() => setExportStatus("idle"), 3000);
      };

      img.src = svgDataUrl;
    } catch (error) {
      console.error("PDF export failed:", error);
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    }
  };

  const nodes = entry.diagramData?.jsonStructure.nodes ?? [];

  const content = (
    <div
      key={logKey}
      style={{ padding: wrapperPadding, isolation: "isolate" }}
      className={`${panelClasses}`}
    >
      <div className="absolute top-5 left-5 z-[9999]">
        <SaveButton clickFunc={handleSave} status={saveStatus} />
      </div>
      <MermaidRenderer
        ref={mermaidRef}
        logKey={logKey}
        code={diagram}
        view={entry.viewSettings}
        nodes={nodes}
      />

      <ViewTools
        id={entry.id}
        view={entry.viewSettings}
        onExportPdf={handleExportPdf}
        exportStatus={exportStatus}
      />
    </div>
  );
  if (!isFullscreen) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#000000] text-[#e5e7eb] overflow-hidden p-6 flex">
      <div className="w-full h-full">{content}</div>
    </div>
  );
}

