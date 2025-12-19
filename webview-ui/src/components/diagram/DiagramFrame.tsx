import { useState, useEffect } from 'react';
import MermaidRenderer from './MermaidRenderer';
import type { DiagramEntry } from '../../state/diagramTypes';
import ViewTools from '../controls/viewContainer/ViewTools';
import { postDiagramToSave } from '../../utils/vsCodeApi';
import SaveButton from '../controls/viewNavigation/SaveButton';

interface diagramFrameType {
  sessionId: string;
  logKey: string;
  entry: DiagramEntry;
}
//declare interface text and key - IMPORT TYPE DIAGRAMENTRY FROM DIAGRAMTYPES FILE - PASS ENTRY AS PROP, PROP IS GONNA HAVE THAT

export default function DiagramFrame({
  sessionId,
  entry,
  logKey,
}: diagramFrameType) {
  const diagram = entry.diagramData?.mermaidSyntax;
  const isFullscreen = entry.viewSettings?.isFullscreen;
  const [saveStatus, setSaveStatus] = useState<string>('idle');
  console.log('🚀Diagram entry text', entry.id, entry.text);

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = '';
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const panelClasses = `relative w-full max-w-full min-h-[300px] bg-[#1f1a24] rounded-lg p-5 overflow-hidden shadow-2xl ${
    isFullscreen ? 'h-full flex flex-col' : ''
  }`;
  const wrapperPadding = isFullscreen ? '0px' : '20px';

  if (diagram === undefined) {
    return;
  }

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    if (!entry || !entry.diagramData) return null;

    const { diagramData } = entry;

    setSaveStatus('saving');

    try {
      const response = await postDiagramToSave(sessionId, diagramData);
      if (response.command === 'AI_RESPONSE') {
        if (response.payload.type === 'DIAGRAM_SAVED') {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('error');
          console.error('save failed'); //change this line later so user sees different feedback
        }
      } else if (response.command === 'ERROR') {
        setSaveStatus('error');
        console.error('Backend Error:', response.payload.message);
      }
    } catch (error) {
      setSaveStatus('error');
      throw new Error(`there was an error while saving diagram, ${error}`);
    }
  };

  const nodes = entry.diagramData?.jsonStructure.nodes ?? [];

  const content = (
    <div
      key={logKey}
      style={{ padding: wrapperPadding, isolation: 'isolate' }}
      className={`${panelClasses}`}
    >
      <div className='absolute top-5 left-5 z-[9999]'>
        <SaveButton clickFunc={handleSave} status={saveStatus} />
      </div>
      <MermaidRenderer
        logKey={logKey}
        code={diagram}
        view={entry.viewSettings}
        nodes={nodes}
      />

      <ViewTools id={entry.id} view={entry.viewSettings} />
    </div>
  );
  if (!isFullscreen) {
    return content;
  }

  return (
    <div className='fixed inset-0 z-[9999] bg-[#000000] text-[#e5e7eb] overflow-hidden p-6 flex'>
      <div className='w-full h-full'>{content}</div>
    </div>
  );
}
