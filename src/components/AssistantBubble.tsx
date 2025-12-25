import React from "react";

interface Props {
  message: string;
  onClose?: () => void;
}

const AssistantBubble: React.FC<Props> = ({ message, onClose }) => {
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 100, zIndex: 80, maxWidth: 360 }}>
      <div className="p-3 rounded-xl shadow-xl bg-card border border-neutral/10">
        <div className="flex items-start gap-3">
          <img src="/loader3.gif" alt="axios" style={{ width: 40, height: 40, borderRadius: 999 }} />
          <div className="flex-1">
            <div className="font-semibold">Axios</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{message}</div>
          </div>
          <button onClick={onClose} className="ml-2 text-muted-foreground">✕</button>
        </div>
      </div>
    </div>
  );
};

export default AssistantBubble;
