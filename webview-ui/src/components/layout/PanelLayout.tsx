import AIChat from "./Aichat";
import ChatLogContainer from "../chat/ChatLogContainer";
import APIKeyButton from "../controls/viewNavigation/APIKeyButton";

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
