interface SaveButtonProps {
  clickFunc: () => void;
  status: string;
}

export default function SaveButton({ clickFunc, status }: SaveButtonProps) {
  let text = 'Save';

  if (status === 'saving') {
    text = 'Saving...';
  } else if (status === 'saved') {
    text = 'Saved!';
  } else if (status === 'error') {
    text = 'error';
  }

  return (
    <button
      className='save-button cursor-pointer px-2 py-1 rounded bg-[#332940] filter
    hover:brightness-125
    transition
    duration-150'
      onMouseEnter={() => console.log('ENTER button')}
      onMouseMove={() => console.log('MOVE button')}
      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      aria-label='save-diagram'
      onClick={clickFunc}
    >
      {text}
    </button>
  );
}
