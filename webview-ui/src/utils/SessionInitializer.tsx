import { useEffect } from 'react';
import { useDiagramDispatch } from '../state/diagramContext';
import { loadSavedDiagram } from '../utils/vsCodeApi';

export default function SessionInitializer() {
  const dispatch = useDiagramDispatch();

  useEffect(() => {
    //put everything in an async func wrapper
    const initializeSession = async () => {
      const newSessionId = crypto.randomUUID();
      dispatch({
        type: 'initialize_session',
        payload: { sessionId: newSessionId },
      });

      //try/catch block to invoke api call
      try {
        const response = await loadSavedDiagram(newSessionId);

        if (response.command === 'AI_RESPONSE') {
          const { payload } = response;

          if (payload.type === 'DIAGRAM') {
            dispatch({
              type: 'load_newDiagram',
              payload: { message: payload.message, data: payload.data },
            });
          } else if (payload.type === 'NO_SAVED_DIAGRAM') {
            dispatch({ type: 'enable_chat' });
          }
        } else if (response.command === 'ERROR') {
          throw new Error(
            `there was an error checking for saved diagram ${response.payload.message}`
          );
        }
      } catch (error) {
        console.error('Saved diagram check failed:', error);
        dispatch({ type: 'enable_chat' });
      }
    };
    initializeSession();
  }, [dispatch]);

  return null;
}
