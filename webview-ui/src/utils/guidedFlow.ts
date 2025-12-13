import type { DiagramAction, DiagramData } from '../state/diagramTypes';

type Dispatch = (action: DiagramAction) => void;

type DriftPayload =
  | { type: 'ALL_MATCHED'; message: string }
  | { type: 'MISSING_DIAGRAM'; message: string; data: DiagramData }
  | { type: 'UNTRACKED_DIAGRAM'; message: string; data: DiagramData };

const Q1_OPTIONS = [
  { text: 'Yes, run a check', action: 'RUN_CHECK' },
  { text: 'No, I want to edit my diagram', action: 'EDIT_EXIT' },
];

const Q2_OPTIONS = [
  { text: 'Yes, update', action: 'SYNC_TO_ACTUAL' },
  { text: 'No, keep the old one', action: 'KEEP_OLD_PLAN' },
  { text: 'I want to edit my diagram', action: 'EDIT_EXIT' },
];

const Q3_OPTIONS = [
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

export const startDriftCheck = (sessionId: string) => {
  // We assume 'START_DRIFT_CHECK' (sets isLoading: true) is dispatched in the calling component.

  hasSeenMissing = false;
  postRunAlignmentCheck(sessionId).catch((error) => {
    console.error('Error triggering drift check:', error);
  });
};

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
    default:
      return;
  }
};
