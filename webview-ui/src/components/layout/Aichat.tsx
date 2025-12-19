import type { FormEvent } from 'react';
import {
  useDiagramState,
  useDiagramDispatch,
} from '../../state/diagramContext';
import { requestStructure } from '../../utils/vsCodeApi';

export default function AIChat() {
  const dispatch = useDiagramDispatch();
  const state = useDiagramState();
  const prompt = state.chat.currentInput;
  const { isChatEnabled, isLoading } = state.view;

  console.log('user input', prompt);
  //TO DO: generate session ID

  //onChange handler to capture user input
  const handleOnChange = (e: FormEvent<HTMLInputElement>) => {
    dispatch({ type: 'set_userInput', payload: e.currentTarget.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('✅ submit button has been clicked!');
    if (!prompt || state.view.isLoading) return;
    dispatch({ type: 'send_userInput' });
    const sessionId = state.session.sessionId;
    try {
      const response = await requestStructure(sessionId, prompt); //Avo's API fetch request here
      const { payload } = response;
      if (!response) {
        throw new Error('No response object received on submit');
      }

      console.log('🍎 response object', response);

      if (payload.type === 'DIAGRAM') {
        dispatch({
          type: 'load_newDiagram',
          payload: { message: payload.message, data: payload.data },
        });
      } else if (payload.type === 'TEXT') {
        dispatch({
          type: 'load_textOnly',
          payload: { message: payload.message },
        });
      }
    } catch (error) {
      dispatch({
        type: 'load_textOnly',
        payload: {
          message: `${error} API Error: Failed to connect to the backend.`,
        },
      });
    }
  };

  return (
    <div className='chat-input'>
      <form onSubmit={handleSubmit}>
        <input
          type='text'
          value={prompt}
          onChange={handleOnChange}
          aria-label='Chat with AI to create and edit diagram'
          role='textbox'
          placeholder='Type here'
          disabled={isLoading || !isChatEnabled}
        />
        <button
          className='transition duration-150 hover:brightness-125'
          type='submit'
          aria-label='Send Message'
          disabled={isLoading || !isChatEnabled}
        >
          <span className='codicon codicon-send' aria-hidden='true'></span>
          <span className='sr-only'>Send</span>
        </button>
      </form>
    </div>
  );
}
