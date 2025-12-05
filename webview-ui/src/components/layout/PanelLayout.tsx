import AIChat from './Aichat';
import ChatLogContainer from '../chat/ChatLogContainer';

export default function PanelLayout() {
  return (
    <div className='mainContainer'>
      <ChatLogContainer />
      <AIChat />
    </div>
  );
}
