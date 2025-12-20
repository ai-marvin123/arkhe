import type {
  DiagramAction,
  DiagramData,
  Options,
} from '../../types/diagramTypes';
import {
  requestAlignmentCheck,
  requestDiagramSync,
} from '../../shared/utils/vsCodeApi';

export type Dispatch = (action: DiagramAction) => void;

export type DriftPayload =
  | { type: 'ALL_MATCHED'; message: string }
  | { type: 'MISSING_DIAGRAM'; message: string; data: DiagramData }
  | { type: 'UNTRACKED_DIAGRAM'; message: string; data: DiagramData }
  | {
      type: 'MIXED_DIAGRAM';
      message: string;
      missingDiagramData: DiagramData;
      untrackedDiagramData: DiagramData;
    };

const Q1_OPTIONS: Options[] = [
  { text: 'Yes, run a check', action: 'RUN_CHECK' },
  { text: 'No, I want to edit my diagram', action: 'EDIT_EXIT' },
];

const Q2_OPTIONS: Options[] = [
  { text: 'Yes, update', action: 'SYNC_TO_ACTUAL' },
  { text: 'No, keep the old one', action: 'KEEP_OLD_PLAN' },
  { text: 'I want to edit my diagram', action: 'EDIT_EXIT' },
];

const Q3_OPTIONS: Options[] = [
  { text: "Yes, let's edit", action: 'EDIT_FINAL_YES' },
  { text: "No, I'm done", action: 'EDIT_FINAL_NO' },
];

export function startGuidedFlowQ1(dispatch: Dispatch) {
  dispatch({
    type: 'proceed_guidedFlow',
    payload: {
      aiScriptText:
        'It looks like your last saved diagram is loaded. Would you like to run an alignment check against your current repository structure?',
      nextStep: 'ASK_FOR_DRIFT_CHECK',
      options: Q1_OPTIONS,
    },
  });
}

let hasSeenMissing = false;

export const startDriftCheck = (sessionId: string, dispatch: Dispatch) => {
  // We assume 'START_DRIFT_CHECK' (sets isLoading: true) is dispatched in the calling component.

  hasSeenMissing = false;
  requestAlignmentCheck(sessionId, dispatch).catch((error) => {
    console.error('Error triggering drift check:', error);
  });
};

//this function will be invoked inside run check api funciton:
export const handleDriftCheckReport = (
  payload: DriftPayload,
  dispatch: Dispatch
) => {
  switch (payload.type) {
    case 'ALL_MATCHED': {
      dispatch({
        type: 'proceed_guidedFlow',
        payload: {
          aiScriptText:
            'Great job! Your repository structure is perfectly aligned with your saved plan.',
          nextStep: 'ASK_FOR_EDIT',
          options: Q3_OPTIONS,
        },
      });
      return;
    }

    case 'MISSING_DIAGRAM': {
      hasSeenMissing = true;

      dispatch({
        type: 'load_newDiagram',
        payload: { message: payload.message, data: payload.data },
      });

      dispatch({
        type: 'proceed_guidedFlow',
        payload: {
          aiScriptText:
            'As shown above, there are missing files. Would you like to edit your diagram?',
          nextStep: 'ASK_FOR_EDIT',
          options: Q3_OPTIONS,
        },
      });
      return;
    }
    case 'UNTRACKED_DIAGRAM': {
      dispatch({
        type: 'load_newDiagram',
        payload: {
          message: payload.message,
          data: payload.data,
        },
      });

      if (!hasSeenMissing) {
        dispatch({
          type: 'proceed_guidedFlow',
          payload: {
            aiScriptText:
              'We found some untracked files in your repository. Would you like to update your diagram to include them or keep the old version?',
            nextStep: 'ASK_FOR_SYNC',
            options: Q2_OPTIONS,
          },
        });
      }
      return;
    }
    case 'MIXED_DIAGRAM': {
      hasSeenMissing = true;

      const { message, missingDiagramData, untrackedDiagramData } = payload;

      // 1. RENDER the first diagram (e.g., the missing files view)
      dispatch({
        type: 'load_newDiagram',
        payload: {
          message: message,
          data: missingDiagramData,
        },
      });

      // 2. RENDER the AI text message (the separator/explanation)

      dispatch({
        type: 'proceed_guidedFlow',
        payload: {
          aiScriptText:
            'I found some missing files, as shown above. Here is the diagram highlighting your untracked files:',
          nextStep: 'MIXED_CASE_SEPARATOR',
          options: [],
        },
      });

      // 3. RENDER the second diagram (the untracked files view)
      dispatch({
        type: 'load_newDiagram',
        payload: {
          message: message,
          data: untrackedDiagramData,
        },
      });

      // 4. RENDER the final question and buttons for the user
      dispatch({
        type: 'proceed_guidedFlow',
        payload: {
          aiScriptText:
            'How would you like to resolve this conflict? Would you like to update your diagram to include your untracked files?',
          nextStep: 'ASK_FOR_SYNC',
          options: Q2_OPTIONS,
        },
      });

      return;
    }
    default:
      return;
  }
};

export const executeSyncAction = async (
  sessionId: string,
  dispatch: Dispatch
) => {
  try {
    const newDiagramData = await requestDiagramSync(sessionId); //avo's api call here
    if (!newDiagramData) {
      throw new Error('API returned no diagram data after sync.');
    }

    dispatch({
      type: 'load_newDiagram',
      payload: {
        message: newDiagramData.payload.message,
        data: newDiagramData.payload.data!,
      },
    });
    dispatch({
      type: 'proceed_guidedFlow',
      payload: {
        aiScriptText: `The diagram has been updated according to your choice. Would you like to edit it now?`,
        nextStep: 'ASK_FOR_EDIT',
        options: Q3_OPTIONS,
      },
    });
  } catch (error) {
    console.error('"Sync Action Flow Error:', error);
  }
};
