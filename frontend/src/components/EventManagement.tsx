import React, { useState, useEffect } from 'react';
import './EventManagement.css';
import { getApiUrl } from '../utils/api';

interface Survey {
  surveyId: string;
  title: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    order: number;
  }>;
  createdAt: string;
}

interface EventManagementProps {
  eventId: string;
  eventTitle?: string;
  onBack?: () => void;
  onStartPresentation?: () => void;
  onCreateSurvey?: () => void;
}

const EventManagement: React.FC<EventManagementProps> = ({
  eventId,
  eventTitle,
  onBack,
  onStartPresentation,
  onCreateSurvey
}) => {
  const [copiedEventId, setCopiedEventId] = useState<boolean>(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [eventInfo, setEventInfo] = useState<{title: string} | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);

  // イベント情報とアンケート一覧を取得
  useEffect(() => {
    const fetchEventAndSurveys = async () => {
      try {
        setLoading(true);
        
        // アンケート一覧を取得
        const surveysResponse = await fetch(getApiUrl(`/api/surveys/events/${eventId}/surveys`));
        const surveysData = await surveysResponse.json();
        
        if (surveysData.success) {
          setSurveys(surveysData.data.surveys);
          // eventTitleが渡されていない場合はAPIから取得を試行
          if (!eventTitle) {
            // より正確にはイベント詳細取得APIが必要だが、現在は簡易対応
            setEventInfo({ title: `イベント ${eventId}` });
          }
        } else {
          setError(surveysData.error || 'アンケート一覧の取得に失敗しました');
        }
      } catch (err) {
        console.error('エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventAndSurveys();
  }, [eventId, eventTitle]);

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
    if (event.key === 'Enter' && onStartPresentation) {
      onStartPresentation();
    }
  };

  const handleSurveyClick = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowQRCode(true);
  };

  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setSelectedSurvey(null);
  };

  const getSurveyResponseUrl = (surveyId: string) => {
    return `${window.location.origin}/events/${eventId}/surveys/${surveyId}`;
  };

  if (loading) {
    return (
      <div className="event-management">
        <div className="event-management-container">
          <h1>読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-management">
        <div className="event-management-container">
          <h1>エラー</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="primary-button">
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-management">
      <div className="event-management-container">
        <h1>イベント管理画面</h1>
        
        <div className="success-message">
          <div className="success-icon">✓</div>
          <p>イベント管理画面です</p>
        </div>

        <div className="event-info">
          <div className="info-group">
            <label>イベント名:</label>
            <div className="info-value event-title">{eventTitle || eventInfo?.title || `イベント ${eventId}`}</div>
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

        {/* アンケート一覧セクション */}
        <div className="surveys-section">
          <h2>作成したアンケート</h2>
          {surveys.length === 0 ? (
            <div className="no-surveys">
              <p>まだアンケートが作成されていません</p>
            </div>
          ) : (
            <div className="surveys-list">
              {surveys.map((survey) => (
                <div key={survey.surveyId} className="survey-item">
                  <div className="survey-info">
                    <h3>{survey.title}</h3>
                    <p>{survey.question}</p>
                    <small>作成日: {new Date(survey.createdAt).toLocaleString('ja-JP')}</small>
                  </div>
                  <button 
                    onClick={() => handleSurveyClick(survey)}
                    className="survey-button"
                  >
                    QRコード表示
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="action-buttons">
          {onBack && (
            <button 
              onClick={onBack}
              className="secondary-button"
            >
              新しいイベントを作成
            </button>
          )}
          {onCreateSurvey && (
            <button 
              onClick={onCreateSurvey}
              className="secondary-button"
            >
              アンケートを作成
            </button>
          )}
          {onStartPresentation && (
            <button 
              onClick={onStartPresentation}
              onKeyPress={handleKeyPress}
              className="primary-button"
            >
              プレゼンテーション画面へ
            </button>
          )}
        </div>

        <div className="instructions">
          <h3>次のステップ:</h3>
          <ol>
            <li>参加者にイベントIDを共有してください</li>
            <li>アンケートを作成して参加者に共有</li>
            <li>プレゼンテーション画面に移動してプレゼンを開始</li>
          </ol>
        </div>
      </div>
      
      {/* QRコードモーダル */}
      {showQRCode && selectedSurvey && (
        <div className="qr-modal-overlay" onClick={handleCloseQRCode}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h2>{selectedSurvey.title}</h2>
              <button onClick={handleCloseQRCode} className="close-button">×</button>
            </div>
            <div className="qr-modal-content">
              <div className="survey-url-section">
                <h3>アンケート回答URL</h3>
                <div className="url-display">
                  <input 
                    type="text" 
                    value={getSurveyResponseUrl(selectedSurvey.surveyId)} 
                    readOnly 
                    className="url-input"
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(getSurveyResponseUrl(selectedSurvey.surveyId))}
                    className="copy-url-button"
                  >
                    コピー
                  </button>
                </div>
              </div>
              
              <div className="qr-placeholder">
                <p>QRコード（実装予定）</p>
                <div className="qr-placeholder-box">
                  <span>QR Code for:</span>
                  <br />
                  <small>{getSurveyResponseUrl(selectedSurvey.surveyId)}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;