interface OptionsButton {
  key: number | string;
  text: string;
  icon?: string;
  clickFunc: () => void;
}

export default function OptionsButton({
  icon,
  key,
  text,
  clickFunc,
}: OptionsButton) {
  return icon ? (
    <button
      key={key}
      type='button'
      className='options-button bg-[#b8b4c4] text-[#202023] cursor-pointer transition duration-150 hover:brightness-115 rounded-xl px-4 py-2.5 flex-1 min-w-0 flex items-center justify-center gap-2'
      onClick={clickFunc}
    >
      <span
        className={`codicon codicon-${icon} flex-shrink-0 text-[14px] leading-none`}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      />
      <span className='leading-none'> {text}</span>
    </button>
  ) : (
    <button
      key={key}
      type='button'
      className='options-button bg-[#b8b4c4] text-[#202023] cursor-pointer transition duration-150 hover:brightness-115 rounded-xl px-4 py-2 flex-1 min-w-0'
      onClick={clickFunc}
    >
      {text}
    </button>
  );
}
