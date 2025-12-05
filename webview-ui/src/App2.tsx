// import { simpleDiagramMock } from '../../src/mocks/diagramMocks';
// import { applyMermaidStyling } from './utils/mermaidGenerator';
// import MermaidRenderer from './components/diagram/MermaidRenderer';
import { DiagramProvider } from './state/diagramStore';
import PanelLayout from './components/layout/PanelLayout';

export default function App() {
  return (
    <DiagramProvider>
      <PanelLayout />
    </DiagramProvider>
  );
  //   const diagram = simpleDiagramMock.data;

  //   if (diagram === undefined) {
  //     return;
  //   }

  //   const styledMermaid = applyMermaidStyling(
  //     diagram.jsonStructure,
  //     diagram.mermaidSyntax
  //   );

  //   return (
  //     <div style={{ padding: '20px' }}>
  //       <h1>{simpleDiagramMock.message}</h1>

  //       <MermaidRenderer code={styledMermaid} />

  //       <pre
  //         style={{
  //           background: '#222',
  //           color: '#0f0',
  //           padding: '10px',
  //           marginTop: '20px',
  //         }}
  //       >
  //         {JSON.stringify(diagram.jsonStructure, null, 2)}
  //       </pre>
  //     </div>
  //   );
}
