import { useDiagramState } from '../../state/diagramContext';
import UserBubble from './UserBubble';
import AIBubble from './AIBubble';
import DiagramFrame from '../diagram/DiagramFrame';

export default function ChatLogContainer() {
  const state = useDiagramState();
  const { log } = state.chat;

  console.log('inside ChatLogContainer', log);
  return (
    <div className='chat-log-container'>
      {log.map((entry) => {
        const key = entry.id;
        const isUser = entry.role === 'user';
        return (
          <div
            key={key}
            className={`w-full flex mb-2 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {isUser && <UserBubble key={key} text={entry.text} />}
            {entry.type === 'DIAGRAM_CONTENT' && (
              <DiagramFrame key={key} entry={entry} />
            )}
            {entry.type === 'TEXT_RESPONSE' && (
              <AIBubble key={key} text={entry.text} />
            )}
          </div>
        );
      })}
    </div>
  );
}
