import AIChat from './Aichat';
import ChatLogContainer from '../chat/ChatLogContainer';

export default function PanelLayout() {
  return (
    <div className='panel-layout'>
      <div className='fixed-bar'>Action Bar here</div>
      <ChatLogContainer />
      <AIChat />
    </div>
  );
}
