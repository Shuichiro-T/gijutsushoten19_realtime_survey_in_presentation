import React, { useState } from 'react';
import './EventRegistration.css';
import { getApiUrl } from '../utils/api';

interface EventRegistrationProps {
  onEventCreated: (eventId: string, title: string) => void;
  onBack: () => void;
}

interface EventCreationResponse {
  success: boolean;
  data?: {
    eventId: string;
    title: string;
    createdAt: string;
  };
  error?: string;
}

const EventRegistration: React.FC<EventRegistrationProps> = ({
  onEventCreated,
  onBack
}) => {
  const [eventTitle, setEventTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      setError('イベント名を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/surveys/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventTitle.trim(),
        }),
      });

      const result: EventCreationResponse = await response.json();

      if (result.success && result.data) {
        onEventCreated(result.data.eventId, result.data.title);
      } else {
        setError(result.error || 'イベントの作成に失敗しました');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('ネットワークエラーが発生しました。サーバーが起動しているか確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleCreateEvent();
    }
  };

  return (
    <div className="event-registration">
      <div className="event-registration-container">
        <h1>イベント登録</h1>
        
        <div className="form-group">
          <label htmlFor="event-title">イベント名:</label>
          <input
            id="event-title"
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例: 第1回技術勉強会"
            className="event-title-input"
            disabled={isLoading}
            maxLength={100}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="button-group">
          <button 
            onClick={onBack}
            disabled={isLoading}
            className="back-button"
          >
            戻る
          </button>
          <button 
            onClick={handleCreateEvent}
            disabled={!eventTitle.trim() || isLoading}
            className="create-button"
          >
            {isLoading ? 'イベント作成中...' : 'イベント作成'}
          </button>
        </div>

        <div className="instructions">
          <h3>イベント作成について:</h3>
          <ul>
            <li>イベント名を入力してイベントを作成します</li>
            <li>イベントIDが自動的に生成されます</li>
            <li>作成後、アンケートの管理画面に移動します</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventRegistration;