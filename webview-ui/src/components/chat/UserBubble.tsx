interface UserBubbleProps {
  logKey: string;
  text: string | null;
}

export default function UserBubble({ text, logKey }: UserBubbleProps) {
  return (
    <div
      className='
        bg-[#6F6C7F] text-[#e5e7eb]
        rounded-xl rounded-bl-md 
        px-4 py-2 max-w-[75%] text-sm leading-relaxed 
      '
      key={logKey}
      role='group'
      aria-label='Your input'
    >
      <p>{text}</p>
    </div>
  );
}
