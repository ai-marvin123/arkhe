import { requestStructure } from '../../shared/utils/vsCodeApi';
import type { DiagramAction } from '../../types/diagramTypes';
export const STARTER_OPTIONS = [
  {
    id: 'starter_web',
    label: 'Full-Stack Web App',
    icon: 'globe',
    prompt:
      'Create a full-stack web app structure with a React frontend and Node.js Express backend. Frontend should have a src folder with components, index.tsx, and package.json. Backend should have a src folder with routes and middleware folders, server.ts, and package.json. Include docker-compose.yml and Dockerfile for PostgreSQL at the root.',
  },
  {
    id: 'starter_data_science',
    label: 'Data Science Project',
    icon: 'graph',
    prompt:
      'Build a Data Science project with a data folder (containing raw and processed subfolders), notebooks folder for Jupyter files, src folder with a modules subfolder for Python code, models folder for saved pickles, and requirements.txt.',
  },
  {
    id: 'starter_mobile',
    label: 'Mobile Application',
    icon: 'device-mobile',
    prompt:
      'Generate a Flutter app with a lib folder containing models, views, controllers, and widgets subfolders. Include assets and test folders at the root, plus pubspec.yaml.',
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
