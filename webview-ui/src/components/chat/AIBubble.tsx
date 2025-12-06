interface AIBubbleProps {
  key: string;
  text: string | null;
}

export default function AIBubble({ text, key }: AIBubbleProps) {
  return (
    <div
      className='
        bg-gray-800 text-gray-200
        rounded-xl rounded-br-md
        px-4 py-2 max-w-[75%] text-sm leading-relaxed 
      '
      key={key}
    >
      <p>{text}</p>
    </div>
  );
}
