interface FullscreenButtonProps {
  clickFunc: () => void;
}

export default function FullscreenButton({ clickFunc }: FullscreenButtonProps) {
  return (
    <button
      onClick={clickFunc}
      className='
        view-buttons
      '
      aria-label='Display selected diagram in full screen'
      title='Toggle Fullscreen'
    >
      <span className='codicon codicon-screen-full' aria-hidden='true'></span>
    </button>
  );
}
