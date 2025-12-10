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
      className='save-button absolute top-2 left-2'
      aria-label='save-diagram'
      onClick={clickFunc}
    >
      {text}
    </button>
  );
}
