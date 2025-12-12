interface FullscreenButtonProps {
  clickFunc: () => void;
}

export default function FullscreenButton({ clickFunc }: FullscreenButtonProps) {
  return (
    <button
      onClick={clickFunc}
      className="
        view-buttons
      "
      title="Toggle Fullscreen">
      ⛶
    </button>
  );
}
