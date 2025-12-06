import { useReducer } from 'react';
import type { PropsWithChildren } from 'react';
import { DiagramContext, DiagramDispatchContext } from './diagramContext';
import { chatReducer } from './diagramReducer';
import { initialState } from './initialState';

//provider
export function DiagramProvider({ children }: PropsWithChildren<object>) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <DiagramContext value={state}>
      <DiagramDispatchContext value={dispatch}>
        {children}
      </DiagramDispatchContext>
    </DiagramContext>
  );
}
