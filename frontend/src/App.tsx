import React, { useState } from 'react';
import './App.css';
import PresentationScreen from './components/PresentationScreen';
import EventRegistration from './components/EventRegistration';
import EventManagement from './components/EventManagement';
import SurveyCreation from './components/SurveyCreation';

type AppState = 'menu' | 'event-registration' | 'event-management' | 'survey-creation' | 'presentation-setup' | 'presenting';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('menu');
  const [presentationUrl, setPresentationUrl] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');

  const handleEventCreated = (newEventId: string, newEventTitle: string) => {
    setEventId(newEventId);
    setEventTitle(newEventTitle);
    setCurrentState('event-management');
  };

  const handleStartPresentation = () => {
    if (presentationUrl.trim()) {
      setCurrentState('presenting');
    }
  };

  const handleStopPresentation = () => {
    setCurrentState('presentation-setup');
  };

  const handleBackToMenu = () => {
    setCurrentState('menu');
    setEventId('');
    setEventTitle('');
    setPresentationUrl('');
  };

  const handleBackToEventRegistration = () => {
    setCurrentState('event-registration');
    setEventId('');
    setEventTitle('');
  };

  const handleCreateSurvey = () => {
    setCurrentState('survey-creation');
  };

  const handleSurveyCreated = (surveyId: string, surveyTitle: string) => {
    // アンケート作成後はイベント管理画面に戻る
    setCurrentState('event-management');
  };

  const handleBackToEventManagement = () => {
    setCurrentState('event-management');
  };

  // 画面の状態管理
  switch (currentState) {
    case 'event-registration':
      return (
        <EventRegistration
          onEventCreated={handleEventCreated}
          onBack={handleBackToMenu}
        />
      );

    case 'event-management':
      return (
        <EventManagement
          eventId={eventId}
          eventTitle={eventTitle}
          onBack={handleBackToEventRegistration}
          onStartPresentation={() => setCurrentState('presentation-setup')}
          onCreateSurvey={handleCreateSurvey}
        />
      );

    case 'survey-creation':
      return (
        <SurveyCreation
          eventId={eventId}
          eventTitle={eventTitle}
          onBack={handleBackToEventManagement}
          onSurveyCreated={handleSurveyCreated}
        />
      );

    case 'presentation-setup':
      return (
        <div className="App">
          <div className="url-input-container">
            <h1>プレゼンテーション指定画面</h1>
            {eventId && (
              <div className="event-info-header">
                <p><strong>イベント:</strong> {eventTitle}</p>
                <p><strong>イベントID:</strong> {eventId}</p>
              </div>
            )}
            <div className="input-group">
              <label htmlFor="presentation-url">Google Slides 共有URL:</label>
              <input
                id="presentation-url"
                type="url"
                value={presentationUrl}
                onChange={(e) => setPresentationUrl(e.target.value)}
                placeholder="https://docs.google.com/presentation/d/..."
                className="url-input"
              />
              <button 
                onClick={handleStartPresentation}
                disabled={!presentationUrl.trim()}
                className="start-button"
              >
                プレゼンテーション開始
              </button>
            </div>
            <div className="button-group">
              <button onClick={handleBackToMenu} className="back-to-menu-button">
                メニューに戻る
              </button>
            </div>
            <div className="instructions">
              <h3>使用方法:</h3>
              <ol>
                <li>Google Slidesの共有URLを入力してください</li>
                <li>「プレゼンテーション開始」ボタンをクリック</li>
                <li>全画面でプレゼンテーションが表示されます</li>
                <li>半透明な四角が描画されることを確認してください</li>
                <li>Escキーで終了できます</li>
              </ol>
            </div>
          </div>
        </div>
      );

    case 'presenting':
      return (
        <PresentationScreen 
          presentationUrl={presentationUrl}
          onExit={handleStopPresentation}
        />
      );

    default: // 'menu'
      return (
        <div className="App">
          <div className="main-menu">
            <h1>リアルタイムアンケートシステム</h1>
            <div className="menu-description">
              <p>プレゼンテーション中にリアルタイムでアンケートを実施できるシステムです</p>
            </div>
            <div className="menu-buttons">
              <button 
                onClick={() => setCurrentState('event-registration')}
                className="menu-button primary"
              >
                新しいイベントを作成
              </button>
              <button 
                onClick={() => setCurrentState('presentation-setup')}
                className="menu-button secondary"
              >
                既存イベントでプレゼン開始
              </button>
            </div>
            <div className="feature-list">
              <h3>主な機能:</h3>
              <ul>
                <li>イベントの作成とID生成</li>
                <li>リアルタイムアンケート機能</li>
                <li>プレゼンテーション画面での結果表示</li>
                <li>参加者からの回答収集</li>
              </ul>
            </div>
          </div>
        </div>
      );
  }
}

export default App;