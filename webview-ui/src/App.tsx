import { DiagramProvider } from './state/diagramStore';
import PanelLayout from './shared/layout/PanelLayout';
import SessionInitializer from './features/start/SessionInitializer';

export default function App() {
  console.log('App is running');
  return (
    <>
      <DiagramProvider>
        <SessionInitializer />
        <PanelLayout />
      </DiagramProvider>
    </>
  );
}
