import React from 'react';
import { X } from 'lucide-react';

interface HistoryItem {
  text: string;
  at: Date;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history }) => {
  const formatTime = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  if (!isOpen) return null;

  return (
    <aside className="panel" aria-label="Notification History">
      <header className="panel-header">
        <h2>Notification History</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close history">
          <X className="w-4 h-4" />
        </button>
      </header>
      <ul className="history-list" role="list">
        {history.map((item, index) => (
          <li key={index} className="history-item">
            [{formatTime(item.at)}] {item.text}
          </li>
        ))}
        {history.length === 0 && (
          <li className="history-item">No notifications yet</li>
        )}
      </ul>
    </aside>
  );
};

export default HistoryPanel;