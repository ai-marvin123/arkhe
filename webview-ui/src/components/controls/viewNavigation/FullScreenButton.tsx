interface FullscreenButtonProps {
  clickFunc: () => void;
}

export default function FullscreenButton({ clickFunc }: FullscreenButtonProps) {
  return (
    <button
      onClick={clickFunc}
      className="
        bg-gray-700 text-white 
        hover:bg-gray-600 
        rounded p-2
      "
      title="Toggle Fullscreen">
      ⛶
    </button>
  );
}
