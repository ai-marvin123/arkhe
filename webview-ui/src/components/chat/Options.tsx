interface OptionsButton {
  key: number | string;
  text: string;
  clickFunc: () => void;
}

export default function OptionsButton({ key, text, clickFunc }: OptionsButton) {
  return (
    <button
      key={key}
      type='button'
      className='options-button bg-[#9894a4] text-[#202023] rounded-xl px-4 py-2 flex-1 min-w-0'
      onClick={clickFunc}
    >
      {text}
    </button>
  );
}
