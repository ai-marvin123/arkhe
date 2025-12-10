import { useDiagramDispatch } from '../../state/diagramContext';
import type { ViewSettings } from '../../state/diagramTypes';
import PanButton from './viewNavigation/PanButton';
import ZoomInButton from './viewNavigation/ZoomInButton';
import ZoomOutButton from './viewNavigation/ZoomOutButton';
import FullscreenButton from './viewNavigation/FullScreenButton';
import ViewAiMessageButton from './viewNavigation/ViewAiMessage';

interface ViewToolstype {
  id: string;
  view: ViewSettings;
}

const zoomStep = 0.1;
const maxZoom = 2.0;
const minZoom = 1.0;

export default function ViewTools({ id, view }: ViewToolstype) {
  const dispatch = useDiagramDispatch();

  //logic for pan
  const handlePan = () => {
    console.log('pan clicked!');
    const newIsPanActive = !view.isPanActive;
    dispatch({
      type: 'update_logEntry',
      payload: { id: id, isPanActive: newIsPanActive },
    });
  };

  //logic for zoom
  const handleZoomIn = () => {
    console.log('zoom in clicked!');
    const newZoom = Math.min(view.zoomLevel + zoomStep, maxZoom);
    dispatch({
      type: 'update_logEntry',
      payload: { id: id, zoomLevel: newZoom },
    });
  };

  const handleZoomOut = () => {
    console.log('view level before', view.zoomLevel);
    console.log('zoom out clicked!');
    const newZoom = Math.max(view.zoomLevel - zoomStep, minZoom);
    dispatch({
      type: 'update_logEntry',
      payload: { id: id, zoomLevel: newZoom },
    });
    console.log('view level after', view.zoomLevel);
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    const newValue = !view.isFullscreen;
    dispatch({
      type: 'update_logEntry',
      payload: { id, isFullscreen: newValue },
    });
  };

  // AI Message toggle
  const handleAiToggle = () => {
    const newValue = !view.isAIOpen;
    dispatch({
      type: 'update_logEntry',
      payload: { id, isAIOpen: newValue },
    });
  };

  return (
    <div className='view-tools-container absolute bottom-2 right-2 flex space-x-2'>
      <ViewAiMessageButton clickFunc={handleAiToggle} />
      <PanButton clickFunc={handlePan} />
      <ZoomInButton clickFunc={handleZoomIn} />
      <ZoomOutButton clickFunc={handleZoomOut} />
      <FullscreenButton clickFunc={handleFullscreen} />
    </div>
  );
}
