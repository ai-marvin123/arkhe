interface FullscreenButtonProps {
  clickFunc: () => void;
}

export default function FullscreenButton({ clickFunc }: FullscreenButtonProps) {
  return (
    <button
      onClick={clickFunc}
      className="
        bg-[#3700b3] text-white 
        hover:bg-[#4f1ed1] 
        rounded p-2
        transition-colors
      "
      title="Toggle Fullscreen">
      ⛶
    </button>
  );
}
