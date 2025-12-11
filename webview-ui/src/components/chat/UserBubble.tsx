interface UserBubbleProps {
  logKey: string;
  text: string | null;
}

export default function UserBubble({ text, logKey }: UserBubbleProps) {
  console.log('inside userbubble', text);
  console.log('🍊user key', logKey);
  return (
    <div
      className='
        bg-[#5b5967] text-[#e5e7eb]
        rounded-xl rounded-bl-md 
        px-4 py-2 max-w-[75%] text-sm leading-relaxed 
      '
      key={logKey}
    >
      <p>{text}</p>
    </div>
  );
}
