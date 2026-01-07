import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import type { ViewSettings, Node } from "../../types/diagramTypes";
import { useDiagramDispatch } from "../../state/diagramContext";
import {
  openFileOnClick,
  openFolderOnClick,
} from "../../shared/utils/vsCodeApi";

interface MermaidRenderResult {
  view: ViewSettings;
  code: string;
  logKey: string;
  nodes: Node[];
  bindFunctions?: (element: Element) => void;
}

export default function MermaidRenderer({
  code,
  view,
  logKey,
  nodes,
}: MermaidRenderResult) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const startPanOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDiagramDispatch();

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    // 1. Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      flowchart: {
        padding: 10,
        useMaxWidth: false,
      },
      theme: "dark",
      themeVariables: {
        lineColor: "#5B5967",
        arrowheadColor: "5B5967",
      },
    });

    if (!containerRef.current) return;

    // 2. Generate a unique ID for the Mermaid diagram
    const id = "mermaid-" + Math.random().toString(36).substring(2);

    // 3. Render the Mermaid code
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!containerRef.current) return;
        containerRef.current!.innerHTML = svg;
        containerRef.current.onclick = (e: MouseEvent) => {
          if (view.isPanActive) return;

          const nodeElement = (e.target as Element).closest(".node");
          if (!nodeElement) return;

          const mermaidId = nodeElement.id;
          const matchedNode = nodes.find(
            (node) =>
              mermaidId === node.id ||
              mermaidId.includes(`-${node.id}-`) ||
              mermaidId.startsWith(`-${node.id}-`)
          );

          if (matchedNode?.path) {
            e.preventDefault();
            e.stopPropagation();

            if (matchedNode.type === "FILE") {
              // console.log('📗file clicked!');
              openFileOnClick(matchedNode.path);
            } else if (matchedNode.type === "FOLDER") {
              // console.log('📕 folder clicked!');
              openFolderOnClick(matchedNode.path);
            }
          }
        };
      })
      .catch((err: Error) => {
        // Handle rendering errors and display them
        console.error("MERMAID ERROR:", err);
        containerRef.current!.innerHTML = `<pre style="color:red; white-space: pre-wrap; word-break: break-all;">Mermaid Rendering Error: ${String(
          err
        )}</pre>`;
      });
  }, [code, view.isPanActive, nodes]);

  //change cursor to grab if pan is activated
  const cursorStyle = view.isPanActive
    ? isDragging
      ? "grabbing"
      : "grab"
    : undefined;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!view.isPanActive) return;
    setIsDragging(true);

    dragStartPosition.current = {
      x: e.clientX,
      y: e.clientY,
    };

    startPanOffset.current = { x: view.panX, y: view.panY };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    // const svgBox = svgElement.getBBox();

    const totalDeltaX = e.clientX - dragStartPosition.current.x;
    const totalDeltaY = e.clientY - dragStartPosition.current.y;

    // 2. Ignore micro-movements (prevents the "1.5 inch jump" on simple clicks)
    if (Math.abs(totalDeltaX) < 3 && Math.abs(totalDeltaY) < 3) return;

    // 3. New Pan = Start Position + Total Mouse Travel
    // No clamping/limits means no snapping bugs!
    const newPanX = startPanOffset.current.x + totalDeltaX;
    const newPanY = startPanOffset.current.y + totalDeltaY;

    // console.log('panX before', view.panX);
    dispatch({
      type: "update_logEntry",
      payload: { id: logKey, panX: newPanX, panY: newPanY },
    });

    // console.log('panX after', view.panX);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // The component returns a div that will hold the rendered diagram
  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center${
        isDragging ? " dragging" : ""
      }`}
      style={{ cursor: cursorStyle, pointerEvents: "auto" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={containerRef}
        className="mermaid-container"
        data-panning={view.isPanActive}
        style={{
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoomLevel})`,
          transformOrigin: "center center",
          transition: "none",
          width: "max-content",
        }}
      />
    </div>
  );
}
