import { createContext } from 'react';
import type { DiagramState, DiagramDispatch } from './diagramTypes';

//context
export const DiagramContext = createContext<DiagramState | null>(null);
export const DiagramDispatchContext = createContext<DiagramDispatch | null>(
  null
);
