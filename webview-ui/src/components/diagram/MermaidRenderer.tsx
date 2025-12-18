import { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import type { ViewSettings, Node } from '../../state/diagramTypes';
import { useDiagramDispatch } from '../../state/diagramContext';
import { openFileOnClick, openFolderOnClick } from '../../utils/vsCodeApi';

interface MermaidRenderResult {
  view: ViewSettings;
  code: string;
  logKey: string;
  nodes: Node[];
  bindFunctions?: (element: Element) => void; // <--- The fix is here
}

export default function MermaidRenderer({
  code,
  view,
  logKey,
  nodes,
}: MermaidRenderResult) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDiagramDispatch();

  //styling the diagram according view features
  const transformStyle = {
    transform: `translate3d(${view.panX}px, ${view.panY}px, 0) scale(${view.zoomLevel})`,
    transformOrigin: '0 0',
  };

  console.log(transformStyle);

  useEffect(() => {
    // 1. Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    if (!containerRef.current) return;

    // 2. Generate a unique ID for the Mermaid diagram
    const id = 'mermaid-' + Math.random().toString(36).substring(2);

    // 3. Render the Mermaid code
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!containerRef.current) return;
        containerRef.current!.innerHTML = svg;
        const svgElement = containerRef.current.querySelector(
          'svg'
        ) as SVGElement | null;

        if (!svgElement || !nodes) return;

        //add event listener on each node for click to open file feature
        nodes.forEach((node: Node) => {
          const selector = `[id*="-${node.id}-"], [id^="${node.id}-"], [id="${node.id}"]`;
          const nodeElement = svgElement.querySelector(
            selector
          ) as HTMLElement | null;

          if (!nodeElement) return;

          if (nodeElement && node.path) {
            nodeElement.style.cursor = view.isPanActive ? 'default' : 'pointer';

            nodeElement.onmouseenter = () => {
              nodeElement.style.filter = 'brightness(1.2)';
              nodeElement.setAttribute('title', node.path);
            };
            nodeElement.onmouseleave = () => {
              nodeElement.style.filter = 'none';
            };
          }

          nodeElement.onclick = (e) => {
            if (view.isPanActive) return;
            e.preventDefault();
            e.stopPropagation();

            if (node.type === 'FILE') {
              openFileOnClick(node.path);
            } else if (node.type === 'FOLDER') {
              openFolderOnClick(node.path);
            }
          };
        });
      })
      .catch((err: Error) => {
        // Handle rendering errors and display them
        console.error('MERMAID ERROR:', err);
        containerRef.current!.innerHTML = `<pre style="color:red; white-space: pre-wrap; word-break: break-all;">Mermaid Rendering Error: ${String(
          err
        )}</pre>`;
      });
  }, [code, view.isPanActive, nodes]);

  //change cursor to grab if pan is activated
  const cursorStyle = view.isPanActive
    ? isDragging
      ? 'grabbing'
      : 'grab'
    : 'default';

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!view.isPanActive) return;
    setIsDragging(true);
    dragStartPosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
    console.log('is dragging', isDragging);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartPosition.current.x;
    const deltaY = e.clientY - dragStartPosition.current.y;

    const newPanX = view.panX + deltaX;
    const newPanY = view.panY + deltaY;

    console.log('panX before', view.panX);
    dispatch({
      type: 'update_logEntry',
      payload: { id: logKey, panX: newPanX, panY: newPanY },
    });
    dragStartPosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
    console.log('panX after', view.panX);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // The component returns a div that will hold the rendered diagram
  return (
    <div
      className='mermaid-container'
      style={{ ...transformStyle, cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={containerRef}
    />
  );
}
