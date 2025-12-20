import { useState, useEffect } from 'react';
import MermaidRenderer from './MermaidRenderer';
import type { DiagramEntry } from '../../types/diagramTypes';
import ViewTools from './ViewTools';
import { postDiagramToSave } from '../../shared/utils/vsCodeApi';
import SaveButton from './viewButtons/SaveButton';

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

  const minSaving = 1000;

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    if (!entry || !entry.diagramData) return null;

    const { diagramData } = entry;

    const startedAt = Date.now();
    setSaveStatus('saving');

    try {
      const response = await postDiagramToSave(sessionId, diagramData);
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minSaving - elapsed);

      if (response.command === 'AI_RESPONSE') {
        if (response.payload.type === 'DIAGRAM_SAVED') {
          window.setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
          }, remaining);
        } else {
          window.setTimeout(() => {
            setSaveStatus('error');
          }, remaining);
        }
      } else if (response.command === 'ERROR') {
        window.setTimeout(() => {
          setSaveStatus('error');
        }, remaining);
        console.error('Backend Error:', response.payload.message);
      }
    } catch (error) {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minSaving - elapsed);

      window.setTimeout(() => {
        setSaveStatus('error');
      }, remaining);
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
