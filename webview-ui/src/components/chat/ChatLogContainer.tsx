import { useDiagramState } from '../../state/diagramContext';
import UserBubble from './UserBubble';
import AIBubble from './AIBubble';
import DiagramFrame from '../diagram/DiagramFrame';
import AiMessageAccordion from './AiMessageAccordion';

export default function ChatLogContainer() {
  const state = useDiagramState();
  const { log } = state.chat;
  const { sessionId } = state.session;

  console.log('inside ChatLogContainer', log);
  return (
    <div className='chat-log-container'>
      {log.map((entry) => {
        const logKey = entry.id;
        const isUser = entry.role === 'user';
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
            {entry.type === 'TEXT_RESPONSE' && (
              <AIBubble logKey={logKey} text={entry.text} />
            )}
          </div>
        );
      })}
    </div>
  );
}
