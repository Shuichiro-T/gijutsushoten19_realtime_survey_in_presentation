import React, { useState } from 'react';
import './EventManagement.css';

interface EventManagementProps {
  eventId: string;
  eventTitle: string;
  onBack: () => void;
  onStartPresentation: () => void;
}

const EventManagement: React.FC<EventManagementProps> = ({
  eventId,
  eventTitle,
  onBack,
  onStartPresentation
}) => {
  const [copiedEventId, setCopiedEventId] = useState<boolean>(false);

  const handleCopyEventId = async () => {
    try {
      await navigator.clipboard.writeText(eventId);
      setCopiedEventId(true);
      setTimeout(() => setCopiedEventId(false), 2000);
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onStartPresentation();
    }
  };

  return (
    <div className="event-management">
      <div className="event-management-container">
        <h1>イベント作成完了</h1>
        
        <div className="success-message">
          <div className="success-icon">✓</div>
          <p>イベントが正常に作成されました！</p>
        </div>

        <div className="event-info">
          <div className="info-group">
            <label>イベント名:</label>
            <div className="info-value event-title">{eventTitle}</div>
          </div>
          
          <div className="info-group">
            <label>イベントID:</label>
            <div className="event-id-group">
              <div className="info-value event-id">{eventId}</div>
              <button 
                onClick={handleCopyEventId}
                className={`copy-button ${copiedEventId ? 'copied' : ''}`}
                title="イベントIDをコピー"
              >
                {copiedEventId ? 'コピー済み!' : 'コピー'}
              </button>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={onBack}
            className="secondary-button"
          >
            新しいイベントを作成
          </button>
          <button 
            onClick={onStartPresentation}
            onKeyPress={handleKeyPress}
            className="primary-button"
          >
            プレゼンテーション画面へ
          </button>
        </div>

        <div className="instructions">
          <h3>次のステップ:</h3>
          <ol>
            <li>参加者にイベントIDを共有してください</li>
            <li>プレゼンテーション画面に移動してプレゼンを開始</li>
            <li>必要に応じてアンケートを作成・実施</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;