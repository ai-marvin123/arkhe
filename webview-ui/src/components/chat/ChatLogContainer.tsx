import { useDiagramState } from '../../state/diagramContext';
import UserBubble from './UserBubble';
import AIBubble from './AIBubble';

export default function ChatLogContainer() {
  const state = useDiagramState();
  const { log } = state.chat;

  return (
    <div className='chatContainer'>
      {log.map((entry) => {
        const key = entry.id;
        if (entry.role === 'user') {
          return <UserBubble key={key} text={entry.text} />;
        }
        if (entry.type === 'DIAGRAM_CONTENT') {
          return <DiagramFrame key={key} entry={entry} />;
        }
        if (entry.type === 'TEXT_RESPONSE') {
          return <AIBubble key={key} text={entry.text} />;
        }
        return null;
      })}
    </div>
  );
}
