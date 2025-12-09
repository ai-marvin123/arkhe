import { useDiagramDispatch } from "../../state/diagramContext";
import type { ViewSettings } from "../../state/diagramTypes";
import FullscreenButton from "./viewNavigation/FullScreenButton";
import ViewAiMessageButton from "./viewNavigation/ViewAiMessage";

interface ViewToolstype {
  id: string;
  view: ViewSettings;
}

export default function ViewTools({ id, view }: ViewToolstype) {
  const dispatch = useDiagramDispatch();

  // Fullscreen toggle
  const handleFullscreen = () => {
    const newValue = !view.isFullscreen;
    dispatch({
      type: "update_logEntry",
      payload: { id, isFullscreen: newValue },
    });
  };

  // AI Message toggle
  const handleAiToggle = () => {
    const newValue = !view.isAIOpen;
    dispatch({
      type: "update_logEntry",
      payload: { id, isAIOpen: newValue },
    });
  };

  return (
    <div className="view-tools-container absolute bottom-2 right-2 flex space-x-2">
      <FullscreenButton clickFunc={handleFullscreen} />
      <ViewAiMessageButton clickFunc={handleAiToggle} />
    </div>
  );
}
