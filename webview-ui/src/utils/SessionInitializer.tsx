import { useEffect } from 'react';
import { useDiagramDispatch } from '../state/diagramContext';
import { loadSavedDiagram, checkUserApiKey } from '../utils/vsCodeApi';
import type { DiagramData } from '../state/diagramTypes';
import {
  MOCK_ALL_MATCHED,
  MOCK_MISSING_DIAGRAM,
  MOCK_UNTRACKED_DIAGRAM,
} from "../../../src/mocks/driftMocks";
import { startGuidedFlowQ1 } from "./guidedFlow";

/**
 * DEV ONLY:
 * Change this value to test different drift states
 * "ALL_MATCHED" | "MISSING" | "UNTRACKED"
 */

export default function SessionInitializer() {
  const dispatch = useDiagramDispatch();

  useEffect(() => {
    //check if user has OpenAI API key saved
    const initializeConnection = async () => {
      try {
        const response = await checkUserApiKey();
        if (!response) {
          throw new Error(
            'No response object returned when inquiring saved user API key'
          );
        }
        if (response.isConfigured === true) {
          return true;
        } else {
          dispatch({
            type: 'load_textOnly',
            payload: {
              message:
                'Please enter your OpenAI API key and model by clicking on the green settings icon above.',
            },
          });
          return false;
        }
      } catch (error) {
        console.error(
          'There was an error initializing connection with user API key',
          error
        );
        return false;
      }
    };
    const executeFlow = async () => {
      // Step A: Check API Key Status (MUST AWAIT)
      const isConfigured = await initializeConnection();
      if (!isConfigured) {
        // Stop execution if key is missing or error occurred
        return;
      }
      const newSessionId = crypto.randomUUID();

      dispatch({
        type: 'initialize_session',
        payload: { sessionId: newSessionId },
      });

      // ---------------- DEV MOCK PATH ----------------
      if (import.meta.env.DEV) {
        const mocks = [
          MOCK_ALL_MATCHED,
          MOCK_MISSING_DIAGRAM,
          MOCK_UNTRACKED_DIAGRAM,
        ];
        mocks.forEach((mock) => {
          const { payload } = mock;
          if ('data' in payload) {
            dispatch({
              type: 'load_newDiagram',
              payload: {
                message: payload.message,
                data: payload.data as DiagramData,
              },
            });
          } else {
            dispatch({
              type: 'load_textOnly',
              payload: { message: payload.message },
            });
          }
        });
        return;
      }
      // ------------------------------------------------

      try {
        console.log('inside sessioninitializer try block');
        const response = await loadSavedDiagram(newSessionId);

        if (response.command === 'AI_RESPONSE') {
          const { payload } = response;

          if (payload.type === 'DIAGRAM') {
            dispatch({
              type: 'load_newDiagram',
              payload: { message: payload.message, data: payload.data },
            });

             startGuidedFlowQ1(dispatch)
             
          } else if (payload.type === "NO_SAVED_DIAGRAM") {
            dispatch({ type: "enable_chat" });
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
    executeFlow();
  }, [dispatch]);

  return null;
}
