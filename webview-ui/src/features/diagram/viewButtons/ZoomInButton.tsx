interface ZoomInButtonType {
  clickFunc: () => void;
}
// console.log('zoomin button');
export default function ZoomInButton({ clickFunc }: ZoomInButtonType) {
  return (
    <button
      className="view-buttons zoom-in-button"
      aria-label="Zoom in to selected diagram"
      onClick={clickFunc}
    >
      <span className="codicon codicon-zoom-in" aria-hidden="true"></span>
    </button>
  );
}
