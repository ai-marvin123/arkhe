import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// FIX: Make bindFunctions optional by adding a '?'
interface MermaidRenderResult {
  svg: string;
  bindFunctions?: (element: Element) => void; // <--- The fix is here
}

export default function MermaidRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      .then(({ svg }: MermaidRenderResult) => {
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

  // The component returns a div that will hold the rendered diagram
  return <div ref={containerRef} />;
}
