import { requestStructure } from '../../shared/utils/vsCodeApi';
import type { DiagramAction } from '../../types/diagramTypes';
export const STARTER_OPTIONS = [
  {
    id: 'starter_web',
    label: 'Full-Stack Web App',
    icon: 'globe',
    prompt:
      'Generate a simple repository structure for a full-stack web application. Include a React frontend (TypeScript), a Node.js Express backend, and a Dockerized PostgreSQL setup. Show the folder hierarchy for components, routes, and middleware.',
  },
  {
    id: 'starter_data_science',
    label: 'Data Science Project',
    icon: 'graph',
    prompt:
      'Create a standard project directory for a Data Science and ML workflow in Python. Include folders for raw and processed data, Jupyter notebooks, source code modules, requirements.txt, and a folder for saved model pickles.',
  },
  {
    id: 'starter_mobile',
    label: 'Mobile Application',
    icon: 'device-mobile',
    prompt:
      'Generate a clean folder architecture for a Flutter mobile application. Focus on the "lib" directory organization, including folders for models, views, controllers (MVC), and common widgets, along with the assets and test structure.',
  },

  {
    id: 'starter_existing_repo',
    label: 'Visualize Existing Repo',
    icon: 'folder-active',
    prompt: 'Generate a diagram of my current repo structure.',
  },
];
export const createStarterAction = async (
  prompt: string,
  sessionId: string,

  dispatch: React.Dispatch<DiagramAction>
) => {
  dispatch({
    type: 'send_starterOption' as const,
    payload: prompt,
  });

  try {
    const response = await requestStructure(sessionId, prompt); //Avo's API fetch request here
    const { payload } = response;
    if (!response) {
      throw new Error('No response object received on submit');
    }

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
