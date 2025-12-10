interface PanButtonType {
  clickFunc: () => void;
}

export default function PanButton({ clickFunc }: PanButtonType) {
  console.log('pan button');
  return (
    <button
      className='view-buttons pan-button'
      aria-label='pan-diagram'
      onClick={clickFunc}
    >
      <span className='codicon codicon-arrow-both' aria-hidden='true'></span>
    </button>
  );
}
