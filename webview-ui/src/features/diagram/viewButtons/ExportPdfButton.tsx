interface ExportPdfButtonProps {
  clickFunc: () => void;
  status: string;
}

export default function ExportPdfButton({
  clickFunc,
  status,
}: ExportPdfButtonProps) {
  const isExporting = status === "exporting";

  return (
    <button
      onClick={clickFunc}
      disabled={isExporting}
      className="view-buttons"
      aria-label={isExporting ? "Exporting PDF…" : "Export diagram as PDF"}
      title="Export as PDF">
      <span
        className={`codicon codicon-file-pdf${isExporting ? " animate-pulse" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}
