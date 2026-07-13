import { useEffect, useState } from 'react';

interface AIBubbleProps {
  logKey: string;
  text: string | null;
}

export default function AIBubble({ text, logKey }: AIBubbleProps) {
  const isLoading = text === 'AI_LOADING';
  const [loadingStage, setLoadingStage] = useState('Thinking');

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer1 = setTimeout(() => {
      setLoadingStage('Generating architecture');
    }, 4000);

    const timer2 = setTimeout(() => {
      setLoadingStage('Rendering diagram');
    }, 14000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoadingStage('Thinking');
    };
  }, [isLoading, logKey]);

  const shouldAnimate =
    loadingStage === 'Generating architecture' ||
    loadingStage === 'Rendering diagram';

  return (
    <div
      className='
        bg-[#3d3a48] text-[#e5e7eb]
        rounded-xl rounded-br-md
        px-4 py-2 max-w-[75%] text-sm leading-relaxed
      '
      role={isLoading ? 'status' : undefined}
      aria-live={isLoading ? 'polite' : undefined}
      key={shouldAnimate ? `${logKey}-${loadingStage}` : logKey}
    >
      {text === 'AI_LOADING' ? (
        <div className='flex items-center gap-2'>
          <span className={shouldAnimate ? 'loading-text' : ''}>
            {loadingStage}
          </span>
          <div className='flex items-center gap-1' aria-hidden='true'>
            <span className='ripple-dot' />
            <span className='ripple-dot delay-1' />
            <span className='ripple-dot delay-2' />
          </div>
        </div>
      ) : (
        <p>{text}</p>
      )}
    </div>
  );
}
