import { useEffect } from 'react';
import { DiagramProvider } from './state/diagramStore';
import PanelLayout from './components/layout/PanelLayout';
import { useDiagramDispatch } from './state/diagramContext';

export default function App() {
  const dispatch = useDiagramDispatch();

  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    dispatch({
      type: 'initialize_session',
      payload: { sessionId: newSessionId },
    });
  }, [dispatch]);

  return (
    <DiagramProvider>
      <PanelLayout />
    </DiagramProvider>
  );
}
