import MermaidRenderer from './MermaidRenderer';
import type { DiagramEntry } from '../../state/diagramTypes';
interface diagramFrameType {
  key: string;
  entry: DiagramEntry;
}
//declare interface text and key - IMPORT TYPE DIAGRAMENTRY FROM DIAGRAMTYPES FILE - PASS ENTRY AS PROP, PROP IS GONNA HAVE THAT

export default function DiagramFrame({ entry, key }: diagramFrameType) {
  const diagram = entry.diagramData?.mermaidSyntax;

  if (diagram === undefined) {
    return;
  }

  return (
    <div
      key={key}
      style={{ padding: '20px' }}
      className='
        w-full max-w-full 
        bg-gray-900 border border-gray-700 
        rounded-lg p-3
      '
    >
      <MermaidRenderer code={diagram} />

      <pre
        style={{
          background: '#222',
          color: '#0f0',
          padding: '10px',
          marginTop: '20px',
        }}
      >
        {JSON.stringify(entry.diagramData?.jsonStructure, null, 2)}
      </pre>
    </div>
  );
}
