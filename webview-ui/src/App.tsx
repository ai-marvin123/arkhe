import { DiagramProvider } from './state/diagramStore';
import PanelLayout from './components/layout/PanelLayout';
import SessionInitializer from './utils/SessionInitializer';

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
