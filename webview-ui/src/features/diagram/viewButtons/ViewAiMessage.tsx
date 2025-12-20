interface ViewAiMessageButtonProps {
  clickFunc: () => void;
}

export default function ViewAiMessageButton({
  clickFunc,
}: ViewAiMessageButtonProps) {
  return (
    <button
      onClick={clickFunc}
      className="
        bg-gray-700 text-white 
        hover:bg-gray-600 
        rounded p-2
      "
      title="Toggle AI Message">
      🧠
    </button>
  );
}
