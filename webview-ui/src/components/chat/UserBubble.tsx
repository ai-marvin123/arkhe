interface UserBubbleProps {
  key: string;
  text: string | null;
}

export default function UserBubble({ text, key }: UserBubbleProps) {
  console.log('inside userbubble', text);
  console.log('🍊user key', key);
  return (
    <div
      className='
        bg-[#434343] text-white 
        rounded-xl rounded-bl-md 
        px-4 py-2 max-w-[75%] text-sm leading-relaxed 
      '
      key={key}
    >
      <p>{text}</p>
    </div>
  );
}
