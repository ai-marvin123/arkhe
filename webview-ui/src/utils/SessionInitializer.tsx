import { useEffect } from 'react';
import { useDiagramDispatch } from '../state/diagramContext';

export default function SessionInitializer() {
  const dispatch = useDiagramDispatch();

  useEffect(() => {
    const newSessionId = crypto.randomUUID();
    dispatch({
      type: 'initialize_session',
      payload: { sessionId: newSessionId },
    });
  }, [dispatch]);

  return null;
}
