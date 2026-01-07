interface PanButtonType {
  clickFunc: () => void;
  isActive: boolean;
}

export default function PanButton({ clickFunc, isActive }: PanButtonType) {
  console.log('pan button');
  return (
    <button
      className={`view-buttons pan-button ${isActive ? 'active' : ''}`}
      aria-label='pan-diagram'
      onClick={clickFunc}
    >
      <span className='codicon codicon-arrow-both' aria-hidden='true'></span>
    </button>
  );
}
