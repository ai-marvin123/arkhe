// import { describe, test, expect, vi, beforeEach } from 'vitest';
// import { render, fireEvent, screen } from '@testing-library/react';
// import AIChat from '../../components/layout/Aichat';
// import type { requestStructure } from '../../utils/vsCodeApi';

// vi.mock('../../utils/vsCodeApi', () => ({
//   requestStructure: mockRequestStructure,
// }));

// // Set up the mocks for imports
// vi.mock('../../state/diagramContext', () => ({
//   useDiagramState: () => mockState,
//   useDiagramDispatch: () => mockDispatch,
// }));

// // Mock the custom hooks used by the component
// const mockDispatch = vi.fn();

// // Mock the API service call (Crucial for controlling the async response)
// const mockRequestStructure = vi.fn();

// const mockState = {
//   chat: { currentInput: 'test prompt' },
//   session: { sessionId: 'TEST-SESSION-123' },
//   view: { isLoading: false },
// };

// // Define the FULL MessageToFrontend structure for success
// const mockMessageToFrontendSuccess = {
//   command: 'AI_RESPONSE' as const,
//   payload: {
//     type: 'DIAGRAM' as const,
//     message: 'Blueprint V2 successfully generated.',
//     data: {
//       mermaidSyntax: 'STYLED::graph TD; A[App];',
//       jsonStructure: {
//         nodes: [
//           /* ... */
//         ],
//         edges: [],
//       },
//     },
//   },
// };

// // Define the FULL MessageToFrontend structure for text-only
// const mockMessageToFrontendText = {
//   command: 'AI_RESPONSE' as const,
//   payload: {
//     type: 'TEXT' as const,
//     message: 'Error: Please clarify your prompt.',
//     data: null,
//   },
// };

// describe('AIChatInput Submission Flow', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//     // Control the API response for success
//     mockRequestStructure.mockResolvedValue(mockMessageToFrontendSuccess);
//   });

//   test('should dispatch send_userInput and load_textOnly on error/text response', async () => {
//     // ARRANGE 1: Set the API to return the text-only error immediately
//     mockRequestStructure.mockResolvedValue(mockMessageToFrontendText);

//     // ARRANGE 2: Render the component into the simulated DOM
//     render(<AIChat />);

//     // Mock state setup (ensures button is not disabled and has text to send)
//     mockState.chat.currentInput = 'Confusing prompt.';
//     mockState.view.isLoading = false; // Ensure loading is off for button to be clickable

//     // ACT 1: Get the button element using its accessible name
//     const submitButton = screen.getByRole('button', { name: /send message/i });

//     // ACT 2: Simulate clicking the submit button
//     fireEvent.click(submitButton);

//     // ASSERTION 1 (Synchronous Check): Verify the initial dispatch to start the process
//     expect(mockDispatch).toHaveBeenCalledTimes(1);
//     expect(mockDispatch).toHaveBeenCalledWith({ type: 'send_userInput' });

//     await vi.waitFor(() => {
//       // ASSERTION 2 (Async Check): Verify the API call was made
//       expect(mockRequestStructure).toHaveBeenCalledTimes(1);

//       // ASSERTION 3 (Final Dispatch Check): Verify the correct final action was dispatched
//       // We expect the second dispatch to be load_textOnly with the inner payload
//       expect(mockDispatch).toHaveBeenCalledTimes(2);
//       expect(mockDispatch).toHaveBeenCalledWith({
//         type: 'load_textOnly',
//         // Pass the inner AiPayload from the mock
//         payload: mockMessageToFrontendText.payload,
//       });
//     });
//   });
// });
