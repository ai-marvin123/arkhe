const MODEL_OPTIONS = ["gpt-5.2", "gpt-5.1", "gpt-4.1"] as const;

export default function APIKeyButton() {
  return (
    <details className="api-key-accordion relative inline-block">
      <summary className="api-key-trigger flex cursor-pointer items-center gap-2 rounded-full border border-[#03baa1] bg-[#03baa1] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#ffffff] transition-opacity hover:opacity-80">
        <span>OpenAI API</span>
        <span
          className="api-key-trigger__icon text-[#00000]"
          aria-hidden="true">
          <span className="when-closed">+</span>
          <span className="when-open">-</span>
        </span>
      </summary>

      <div className="api-key-panel absolute left-0 top-12 z-20 w-72 rounded-lg border border-[#2c2235] bg-[#0a090f] p-4 text-[#f3f4f6] shadow-xl">
        <div className="space-y-1">
          <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#9ca3af]">
            OpenAI Key
          </label>
          <input
            type="password"
            placeholder="sk-..."
            className="w-full rounded-md border border-[#2f2537] bg-[#140f1a] px-3 py-2 text-sm text-[#f9fafb] placeholder:text-[#6b7280] focus:border-[#a78bfa] focus:outline-none"
          />
          <p className="text-[0.6rem] text-[#6b7280]">
            Please enter your key above
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#9ca3af]">
            Model
          </p>
          {MODEL_OPTIONS.map((option, index) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1 text-sm transition hover:border-[#3b2b51]">
              <input
                type="radio"
                name="openai-model"
                defaultChecked={index === 0}
                className="h-3 w-3 accent-[#a78bfa]"
              />
              <span className="text-[#e5e7eb]">{option.toUpperCase()}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end text-[0.65rem] text-[#6b7280]">
          <button
            type="button"
            className="rounded-full border border-[#03baa1] bg-[#03baa1] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#ffffff] transition hover:opacity-80">
            Save
          </button>
        </div>
      </div>
    </details>
  );
}
