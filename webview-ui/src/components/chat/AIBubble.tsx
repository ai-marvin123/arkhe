interface AIBubbleProps {
  logKey: string;
  text: string | null;
}

export default function AIBubble({ text, logKey }: AIBubbleProps) {
  return (
    <div
      className='
        bg-[#3d3a48] text-[#e5e7eb]
        rounded-xl rounded-br-md
        px-4 py-2 max-w-[75%] text-sm leading-relaxed 
      '
      key={logKey}
    >
      {text === 'AI_LOADING' ? (
        <div className='flex items-center gap-2'>
          <span>Loading</span>
          <div className='flex items-center gap-1'>
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
