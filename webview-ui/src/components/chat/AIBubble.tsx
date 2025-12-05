interface AIBubbleProps {
  key: string;
  text: string | null;
}

export default function AIBubble({ text, key }: AIBubbleProps) {
  return (
    <div className='userBubble' key={key}>
      <p>{text}</p>
    </div>
  );
}
