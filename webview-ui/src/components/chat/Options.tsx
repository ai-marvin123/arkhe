interface OptionsButton {
  text: string;
  clickFunc: () => void;
}

export default function OptionsButton({ text, clickFunc }: OptionsButton) {
  return (
    <button className='options-button' onClick={clickFunc}>
      {text}
    </button>
  );
}
