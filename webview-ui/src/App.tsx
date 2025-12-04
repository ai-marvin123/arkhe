// import { useState, useEffect } from 'react';
// // import viteLogo from './assets/vite.svg';
// // import reactLogo from './assets/react.svg';

// declare function acquireVsCodeApi(): {
//   postMessage: (message: unknown) => void;
//   getState: () => unknown;
//   setState: (state: unknown) => void;
// };

// const vscode =
//   typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

// function App() {
//   const [count, setCount] = useState(0);
//   const [serverMessage, setServerMessage] = useState<string>('');

//   useEffect(() => {
//     const handleMessage = (event: MessageEvent) => {
//       const message = event.data;
//       if (message.command === 'replyFromExtension') {
//         setServerMessage(
//           `Status: ${message.payload.status} at ${message.payload.serverTimestamp}`
//         );
//       }
//     };

//     window.addEventListener('message', handleMessage);
//     return () => window.removeEventListener('message', handleMessage);
//   }, []);

//   const handleSend = () => {
//     if (vscode) {
//       vscode.postMessage({
//         command: 'showWarning',
//         text: 'User clicked the button in React!',
//       });
//     } else {
//       console.warn(
//         'VS Code API is not available in standard browser environment'
//       );
//     }
//   };

//   return (
//     <div className='min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white font-sans'>
//       <div className='flex gap-8 mb-8'>
//         <a
//           href='https://vite.dev'
//           target='_blank'
//           className='hover:drop-shadow-[0_0_2em_#646cffaa] transition duration-300'
//         >
//           <img
//             src={viteLogo}
//             className='h-24 w-24 hover:scale-110 transition-transform'
//             alt='Vite logo'
//           />
//         </a>
//         <a
//           href='https://react.dev'
//           target='_blank'
//           className='hover:drop-shadow-[0_0_2em_#61dafbaa] transition duration-300'
//         >
//           <img
//             src={reactLogo}
//             className='h-24 w-24 animate-[spin_20s_linear_infinite] hover:scale-110 transition-transform'
//             alt='React logo'
//           />
//         </a>
//       </div>

//       <h1 className='text-5xl font-extrabold mb-8 bg-linear-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent text-center'>
//         Vite + React + Tailwind
//       </h1>

//       <div className='bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg flex flex-col gap-6'>
//         <div className='flex flex-col sm:flex-row gap-4 justify-center'>
//           <button
//             onClick={() => setCount((count) => count + 1)}
//             className='flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all border border-slate-600 hover:border-slate-500'
//           >
//             Count is {count}
//           </button>

//           <button
//             onClick={handleSend}
//             className='flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95'
//           >
//             Test Connection
//           </button>
//         </div>

//         <p className='text-slate-400 text-center text-sm'>
//           Edit{' '}
//           <code className='bg-slate-900 px-2 py-1 rounded text-blue-300 font-mono mx-1'>
//             src/App.tsx
//           </code>{' '}
//           to test HMR
//         </p>

//         {serverMessage && (
//           <div className='mt-2 p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-400 text-sm wrap-break-word animate-pulse'>
//             <span className='block font-bold mb-1 text-green-300 uppercase tracking-wider text-xs'>
//               Received from Backend
//             </span>
//             {serverMessage}
//           </div>
//         )}
//       </div>

//       {!vscode && (
//         <div className='mt-8 px-4 py-2 bg-yellow-900/30 text-yellow-200 rounded-full text-xs border border-yellow-700/50 flex items-center gap-2'>
//           <span className='w-2 h-2 rounded-full bg-yellow-400 animate-ping'></span>
//           Running in Browser Mode (No Extension API)
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
