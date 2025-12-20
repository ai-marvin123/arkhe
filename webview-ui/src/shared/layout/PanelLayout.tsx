import AIChat from "../../features/chat/Aichat";
import ChatLogContainer from "../../features/chat/ChatLogContainer";
import APIKeyButton from "../../features/chat/APIKeyButton";

export default function PanelLayout() {
  return (
    <div className="panel-layout">
      <div className="fixed-bar">
        <APIKeyButton />
      </div>
      <ChatLogContainer />
      <AIChat />
    </div>
  );
}
