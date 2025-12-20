interface SaveButtonProps {
  clickFunc: () => void;
  status: string;
}

export default function SaveButton({ clickFunc, status }: SaveButtonProps) {
  const isSaving = status === 'saving';
  const isSaved = status === 'saved';
  const isError = status === 'error';

  const overlayClasses = isSaved
    ? 'scale-y-100 opacity-100 duration-200'
    : isSaving
    ? 'animate-fillOverlay'
    : 'scale-y-0 opacity-0';
  const overlayColor = isError ? 'bg-[#CF6679]' : 'bg-[#8B50DA]';

  return (
    <button
      className='relative save-button cursor-pointer px-3.5 py-2 w-16 filter
    hover:brightness-125
    transition
    duration-150'
      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      aria-label={status ? status : 'Save diagram to your repo'}
      onClick={clickFunc}
      type='button'
    >
      <div className='pointer-events-none absolute inset-0 z-[-20] rounded bg-[#332940]' />
      <span className='relative z-10'>
        {status === 'saved' ? 'Saved!' : 'Save'}
      </span>
      <div
        className={[
          'pointer-events-none absolute inset-0 z-0 rounded',
          'origin-bottom transform-gpu',
          overlayColor,
          'rounded',
          'transition-[transform,opacity] ease-out',
          overlayClasses,
        ].join(' ')}
        style={{ transitionDuration: status === 'idle' ? '700ms' : '200ms' }}
      />
    </button>
  );
}
