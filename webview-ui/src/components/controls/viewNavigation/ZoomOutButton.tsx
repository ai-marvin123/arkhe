interface ZoomOutButtonType {
  clickFunc: () => void;
}

export default function ZoomOutButton({ clickFunc }: ZoomOutButtonType) {
  console.log('zoomout button');
  return (
    <button
      className='view-buttons zoom-out-button'
      aria-label='Zoom out of selected diagram'
      onClick={clickFunc}
    >
      <span className='codicon codicon-zoom-out' aria-hidden='true'></span>
    </button>
  );
}
