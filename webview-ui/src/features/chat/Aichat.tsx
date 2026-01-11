import type { FormEvent } from "react";
import {
  useDiagramState,
  useDiagramDispatch,
} from "../../state/diagramContext";
import { requestStructure } from "../../shared/utils/vsCodeApi";

export default function AIChat() {
  const dispatch = useDiagramDispatch();
  const state = useDiagramState();
  const prompt = state.chat.currentInput;
  const { isChatEnabled, isLoading } = state.view;

  // console.log('user input', prompt);
  //TO DO: generate session ID

  //onChange handler to capture user input
  const handleOnChange = (e: FormEvent<HTMLInputElement>) => {
    dispatch({ type: "set_userInput", payload: e.currentTarget.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt || state.view.isLoading) return;

    // Step 1: Frontend submit - capture start time
    const requestStartTime = performance.now();
    const requestId = "req_" + Math.random().toString(36).substring(2, 10);

    dispatch({ type: "send_userInput" });
    const sessionId = state.session.sessionId;
    try {
      const response = await requestStructure(
        sessionId,
        prompt,
        requestId,
        requestStartTime
      );
      const { payload } = response;
      if (!response) {
        throw new Error("No response object received on submit");
      }

      if (payload.type === "DIAGRAM") {
        dispatch({
          type: "load_newDiagram",
          payload: { message: payload.message, data: payload.data },
        });
      } else if (payload.type === "TEXT") {
        dispatch({
          type: "load_textOnly",
          payload: { message: payload.message },
        });
      }
    } catch (error) {
      dispatch({
        type: "load_textOnly",
        payload: {
          message: `${error} API Error: Failed to connect to the backend.`,
        },
      });
    }
  };

  return (
    <div className="chat-input">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={handleOnChange}
          aria-label="Chat with AI to create and edit diagram"
          role="textbox"
          placeholder="Type here"
          disabled={isLoading || !isChatEnabled}
        />
        <button
          className="transition duration-150 hover:brightness-125"
          type="submit"
          aria-label="Send Message"
          disabled={isLoading || !isChatEnabled}
        >
          <span className="codicon codicon-send" aria-hidden="true"></span>
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
}
