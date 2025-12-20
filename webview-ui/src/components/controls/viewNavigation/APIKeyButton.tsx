import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { sendUserApiKey } from "../../../utils/vsCodeApi";

const MODEL_OPTIONS = [
  {
    value: "gpt-4o-mini",
    label: "gpt-4o-mini (Recommended)",
  },
  {
    value: "gpt-3.5-turbo",
    label: "gpt-3.5-turbo (Budget)",
  },
  {
    value: "gpt-4o",
    label: "gpt-4o (Premium)",
  },
] as const;
const PROVIDER = "openai";

export default function APIKeyButton() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const model =
      (formData.get("openai-model") as string) || MODEL_OPTIONS[0].value;
    const apiKeyInput = apiKey.trim();

    if (!apiKeyInput) {
      setError("Please fill out this field");
      return;
    }

    try {
      type SaveResponse = {
        success?: boolean;
        message?: string;
        payload?: { success?: boolean; message?: string };
      };

      const response: SaveResponse = await sendUserApiKey(
        PROVIDER,
        model,
        apiKeyInput
      );
      const success = response.payload?.success ?? response.success ?? false;
      const message = response.payload?.message ?? response.message;

      if (!success) {
        setError(message ?? "");
        return;
      }

      setError(null);
      setApiKey("");
      // Close the popup on successful save.
      detailsRef.current?.removeAttribute("open");
    } catch (error) {
      console.error("Failed to save OpenAI settings:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save settings. Try again.";
      setError(message);
    }
  };

  return (
    <details
      ref={detailsRef}
      className="api-key-accordion relative inline-block">
      <summary className="api-key-trigger flex cursor-pointer items-center gap-2 rounded-full border border-[#008c6e] bg-[#008c6e] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#ffffff] filter hover:brightness-125 transition duration-150 hover:opacity-90">
        <span>OpenAI API</span>
        <span
          className="api-key-trigger__icon text-[#ffffff]"
          aria-hidden="true">
          <span className="when-closed">+</span>
          <span className="when-open">-</span>
        </span>
      </summary>

      <form
        className="api-key-panel absolute left-0 top-12 z-20 w-72 rounded-lg border border-[#2c2235] bg-[#0a090f] p-4 text-[#f3f4f6] shadow-xl"
        onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#9ca3af]"
            htmlFor="openai-key">
            OpenAI Key
          </label>
          <div className="relative">
            <input
              id="openai-key"
              name="openai-key"
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-md border border-[#2f2537] bg-[#140f1a] px-3 pr-10 py-2 text-sm text-[#f9fafb] placeholder:text-[#6b7280] focus:border-[#a78bfa] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center text-[#9ca3af] hover:text-[#f3f4f6]"
              aria-label={showKey ? "Hide API key" : "Show API key"}>
              {showKey ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {apiKey.trim().length > 0 && (
            <p className="text-[0.6rem] text-[#6b7280]">
              Your key willl be saved locally on VScode
            </p>
          )}
          {error && (
            <p
              className="text-[0.6rem] text-[#CF6679]"
              role="alert"
              aria-live="polite">
              {error}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#9ca3af]">
            Model
          </p>
          {MODEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1 text-sm transition hover:border-[#3b2b51]">
              <input
                type="radio"
                name="openai-model"
                value={option.value}
                defaultChecked={option.value === MODEL_OPTIONS[0].value}
                className="h-3 w-3 accent-[#a78bfa]"
              />
              <span className="text-[#e5e7eb]">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-end text-[0.65rem] text-[#6b7280]">
          <button
            type="submit"
            className="rounded-full border border-[#008c6e] bg-[#008c6e] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#ffffff] filter hover:brightness-125 transition duration-150 hover:opacity-90">
            Save
          </button>
        </div>
      </form>
    </details>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4">
      <path d="M1.5 12s3.5-6 10.5-6 10.5 6 10.5 6-3.5 6-10.5 6S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4">
      <path d="M3 3l18 18" />
      <path d="M10.7 5.1A9.77 9.77 0 0 1 12 5c7 0 10.5 6 10.5 6a17.6 17.6 0 0 1-3.43 4.1" />
      <path d="M6.73 6.73C3.64 8.56 1.5 12 1.5 12s3.5 6 10.5 6c1.02 0 1.99-.12 2.9-.34" />
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
    </svg>
  );
}
