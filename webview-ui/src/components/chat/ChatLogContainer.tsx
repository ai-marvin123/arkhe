import { useDiagramState } from '../../state/diagramContext';
import UserBubble from './UserBubble';
import AIBubble from './AIBubble';
import DiagramFrame from '../diagram/DiagramFrame';

export default function ChatLogContainer() {
  const state = useDiagramState();
  const { log } = state.chat;

  return (
    <div className='chat-log-container'>
      {log.map((entry) => {
        const key = entry.id;
        return (
          <div
            key={entry.id}
            className={`log-entry-wrapper ${
              entry.role === 'user' ? 'user' : 'assistant'
            }`}
          >
            {entry.role === 'user' && (
              <UserBubble key={key} text={entry.text} />
            )}
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
