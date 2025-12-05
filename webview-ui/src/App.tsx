import { DiagramProvider } from './state/diagramStore';
import PanelLayout from './components/layout/PanelLayout';

export default function App() {
  return (
    <DiagramProvider>
      <PanelLayout />
    </DiagramProvider>
  );
}
