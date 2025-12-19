import {
  useDiagramState,
  useDiagramDispatch,
} from '../../state/diagramContext';
import UserBubble from './UserBubble';
import AIBubble from './AIBubble';
import DiagramFrame from '../diagram/DiagramFrame';
import AiMessageAccordion from './AiMessageAccordion';
import { startDriftCheck, executeSyncAction } from '../../utils/guidedFlow';
import type { Dispatch } from '../../utils/guidedFlow';
import OptionsButton from './Options';
import type { GuidedAction } from '../../state/diagramTypes';

interface GuidedTextEntry {
  id: string;
  text: string;
  options: Array<{ text: string; action: GuidedAction }>;
}

export default function ChatLogContainer() {
  const state = useDiagramState();
  const { log } = state.chat;
  const { sessionId } = state.session;
  const { isLoading } = state.view;

  const dispatch = useDiagramDispatch();

  console.log('🏳️‍🌈inside ChatLogContainer', log);

  const handleGuidedChoice = (
    entryId: string,
    action: string,
    text: string
  ) => {
    console.log('inside handleGuidedChoice');
    dispatch({
      type: 'log_userChoice',
      payload: { logEntryId: entryId, chosenText: text },
    });

    if (action === 'RUN_CHECK') {
      startDriftCheck(sessionId, dispatch);
    } else if (action === 'EDIT_EXIT' || action === 'KEEP_OLD_PLAN') {
      dispatch({
        type: 'proceed_guidedFlow',
        payload: {
          aiScriptText:
            'Chat is now enabled. What changes would you like to make?',
          options: [],
          nextStep: 'IDLE',
        },
      });
      dispatch({ type: 'enable_chat' });
    } else if (action === 'SYNC_TO_ACTUAL') {
      executeSyncAction(state.session.sessionId, dispatch as Dispatch);
    } else if (action === 'EDIT_FINAL_YES' || action === 'EDIT_FINAL_NO') {
      const finalScript =
        action === 'EDIT_FINAL_YES'
          ? "Chat enabled. Let me know what edits you'd like to make."
          : 'Understood. Alignment check is now complete.';

      dispatch({
        type: 'proceed_guidedFlow',
        payload: {
          aiScriptText: finalScript,
          nextStep: 'IDLE',
          options: [],
        },
      });
      dispatch({ type: 'enable_chat' });
    }
  };
  return (
    <div className='chat-log-container'>
      {log.map((entry) => {
        const logKey = entry.id;
        const isUser = entry.role === 'user';

        const hasOptions = entry.type === 'TEXT_RESPONSE' && 'options' in entry;
        const guidedEntry = hasOptions
          ? (entry as unknown as GuidedTextEntry)
          : null;

        return (
          <div
            key={logKey}
            className={`w-full flex mb-2 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {isUser && <UserBubble logKey={logKey} text={entry.text} />}
            {entry.type === 'DIAGRAM_CONTENT' && (
              <div className='w-full flex flex-col'>
                <DiagramFrame
                  sessionId={sessionId}
                  logKey={logKey}
                  entry={entry}
                />
                <AiMessageAccordion entry={entry} />
              </div>
            )}

            {(entry.type === 'TEXT_RESPONSE' || hasOptions) && !isUser && (
              <div className='w-full flex flex-col items-start'>
                {entry.type === 'TEXT_RESPONSE' && (
                  <AIBubble logKey={logKey} text={entry.text} />
                )}
                {hasOptions && guidedEntry && (
                  <div className='w-full flex justify-start mt-2 space-x-2'>
                    {guidedEntry.options.map((option, index) => (
                      <OptionsButton
                        key={index}
                        text={option.text}
                        clickFunc={() =>
                          handleGuidedChoice(logKey, option.action, option.text)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {isLoading && (
        <div className='w-full flex justify-start mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
          <AIBubble logKey='ai-loading' text='AI_LOADING' />
        </div>
      )}
    </div>
  );
}
