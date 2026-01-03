import type { DiagramEntry } from "../../types/diagramTypes";
import { useDiagramDispatch } from "../../state/diagramContext";

interface AiMessageAccordionProps {
  entry: DiagramEntry;
}

export default function AiMessageAccordion({ entry }: AiMessageAccordionProps) {
  const dispatch = useDiagramDispatch();
  const isOpen = Boolean(entry.viewSettings?.isAIOpen);

  const toggle = () => {
    dispatch({
      type: "update_logEntry",
      payload: {
        id: entry.id,
        isAIOpen: !entry.viewSettings?.isAIOpen,
      },
    });
  };
  // <div className="bg-[#3d3a48] border border-[#3d3a48] rounded-lg px-3 py-2 text-sm leading-relaxed w-fit max-w-[70%] text-left">
  return (
    <div className="mt-2 w-full flex justify-start">
      <div className="rounded-lg border border-slate-800 bg-[#1b1f2b] text-slate-50 px-4 py-3 w-fit max-w-full">
        <button
          type="button"
          className="w-full flex items-center justify-between font-semibold text-left text-slate-100 gap-6"
          onClick={toggle}>
          <span>AI Message</span>
          <span className="text-base">{isOpen ? "▾" : "▸"}</span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 flex justify-start ${
            isOpen ? "max-h-72 mt-3" : "max-h-0"
          }`}>
          {isOpen && (
            <div>
              <p className="font-semibold mb-1 text-slate-100"></p>
              <p className="text-slate-200">{entry.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
