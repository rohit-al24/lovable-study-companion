import React from 'react';

interface Props {
  state: 'hidden' | 'listening' | 'recognizing' | 'reply';
  transcript?: string;
  reply?: string;
  onClose?: () => void;
}

const AssistantPopup: React.FC<Props> = ({ state, transcript = '', reply = '', onClose }) => {
  if (state === 'hidden') return null;
  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 24, zIndex: 90, width: 'min(680px, 94%)' }}>
      <div className="p-4 rounded-xl shadow-xl bg-card border border-neutral/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 44, height: 44, borderRadius: 44, overflow: 'hidden' }}>
              <img src="/loader3.gif" alt="axios" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div className="font-semibold">Axios</div>
              <div className="text-sm text-muted-foreground">
                {state === 'listening' && 'Listening...'}
                {state === 'recognizing' && 'Recognizing speech...'}
                {state === 'reply' && 'Reply'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground">✕</button>
        </div>

        <div className="mt-3">
          {state === 'listening' && (
            <div className="text-sm text-foreground">{transcript || 'Speak now...'}</div>
          )}
          {state === 'recognizing' && (
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-primary animate-pulse" />
              <div className="text-sm text-foreground">Recognizing speech...</div>
            </div>
          )}
          {state === 'reply' && (
            <div className="text-sm whitespace-pre-wrap text-foreground">{reply}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantPopup;
