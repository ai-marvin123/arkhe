import type {FormEvent} from 'react';
import { useDiagramState, useDiagramDispatch } from '../state/diagramContext';
import type { AiResponsePayload } from '../state/diagramTypes';

export default function AIChat() {
  const state = useDiagramState();
  const dispatch = useDiagramDispatch();
  const prompt = state.chat.currentInput;

  //TO DO: generate session ID

  //onChange handler to capture user input
  const handleOnChange = (e: FormEvent<HTMLInputElement>) => {
    dispatch({ type: 'set_userInput', payload: e.currentTarget.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt || state.view.isLoading) return;
    dispatch({type: 'send_userInput'});
    const sessionId = state.session.sessionId;
    try{
        const response: AiResponsePayload = await ;//Avo's API fetch request here

        if (!response) {
            throw new Error('No response object received on submit')
        }

        if (response.type === 'DIAGRAM'){
            dispatch({type: 'load_newDiagram', payload: {message: response.message, data: response.data}})
        }else if (response.type === 'TEXT'){
            dispatch({type: 'load_textOnly', payload: {message: response.message}})
        }
    }catch (error){
         dispatch({type: 'load_textOnly', payload: {message: 'API Error: Failed to connect to the backend.'}})
    }
  }
  return (
    <form onSubmit = {handleSubmit}>
      <input
        type='text'
        value={prompt}
        onChange={handleOnChange}
        placeholder='Type here'
      />
      <button type='submit' disabled={state.view.isLoading}>
        Send
      </button>
    </form>
  );
}
//1. save user input
//2. make api request
//3. receive and process incoming data (promise)
//4. render diagram and message

//form component with onsubmit
//input field
