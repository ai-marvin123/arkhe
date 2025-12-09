import { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import type { ViewSettings } from '../../state/diagramTypes';
import { useDiagramDispatch } from '../../state/diagramContext';

// FIX: Make bindFunctions optional by adding a '?'
interface MermaidRenderResult {
  view: ViewSettings;
  code: string;
  logKey: string;
  bindFunctions?: (element: Element) => void; // <--- The fix is here
}

export default function MermaidRenderer({
  code,
  view,
  logKey,
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
      // The types now match, resolving the TypeScript error
      .then(({ svg }) => {
        // Inject the generated SVG into the container
        containerRef.current!.innerHTML = svg;
      })
      .catch((err: Error) => {
        // Handle rendering errors and display them
        console.error('MERMAID ERROR:', err);
        containerRef.current!.innerHTML = `<pre style="color:red; white-space: pre-wrap; word-break: break-all;">Mermaid Rendering Error: ${String(
          err
        )}</pre>`;
      });
  }, [code]);

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
