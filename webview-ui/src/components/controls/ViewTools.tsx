import { useDiagramDispatch } from "../../state/diagramContext";
import type { ViewSettings } from "../../state/diagramTypes";
import FullscreenButton from "./viewNavigation/FullScreenButton";

interface ViewToolstype {
  id: string;
  view: ViewSettings;
}

export default function ViewTools({ id, view }: ViewToolstype) {
  const dispatch = useDiagramDispatch();
  //all features use reducer function 'update_logEntry'

  //logic for pan

  //logic for zoom

  //logic for fullscreen
  const handleFullscreen = () => {
    const newValue = !view.isFullscreen;
    dispatch({
      type: "update_logEntry",
      payload: { id, isFullscreen: newValue },
    });
  };
  //logic for AiMessage

  return (
    <div className="view-tools-container absolute bottom-2 right-2 flex space-x-2">
      <FullscreenButton clickFunc={handleFullscreen} />
    </div>
  );
}
