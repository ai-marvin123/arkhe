import type {FormEvent} from 'react';
import { useDiagramState, useDiagramDispatch } from '../state/diagramContext';
import type { BackendMessage } from '../state/diagramTypes';

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
        const response: BackendMessage = await ;//Avo's API fetch request here
        const {payload} = response;
        if (!response) {
            throw new Error('No response object received on submit')
        }

        if (payload.type === 'DIAGRAM'){
            dispatch({type: 'load_newDiagram', payload: {message: payload.message, data: payload.data}})
        }else if (payload.type === 'TEXT'){
            dispatch({type: 'load_textOnly', payload: {message: payload.message}})
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
      <button type='submit' aria-label='Send Message' disabled={state.view.isLoading} className={`
    flex items-center justify-center 
    p-2 rounded-lg text-white font-semibold 
    transition-colors duration-200 
    ${state.view.isLoading 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-blue-600 hover:bg-blue-700'
    }
  `}>
    <span className="codicon codicon-send text-lg" aria-hidden="true"></span>{' '}
      </button>
    </form>
  );
}
