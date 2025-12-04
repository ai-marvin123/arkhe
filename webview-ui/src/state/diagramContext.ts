import { createContext, useContext } from 'react';
import type { DiagramState, DiagramDispatch } from './diagramTypes';

//context
export const DiagramContext = createContext<DiagramState | null>(null);
export const DiagramDispatchContext = createContext<DiagramDispatch | null>(
  null
);

export function useDiagramState(): DiagramState {
  const context = useContext(DiagramContext);
  if (context === null) {
    throw new Error('useDiagramState must be used within a DiagramProvider');
  }
  return context;
}

export function useDiagramDispatch(): DiagramDispatch {
  const context = useContext(DiagramDispatchContext);
  if (context === null) {
    throw new Error('useDiagramDispatch must be used within a DiagramProvider');
  }
  return context;
}
