import React, { useState } from 'react';
import './App.css';
import PresentationScreen from './components/PresentationScreen';

function App() {
  const [presentationUrl, setPresentationUrl] = useState<string>('');
  const [isPresenting, setIsPresenting] = useState(false);

  const handleStartPresentation = () => {
    if (presentationUrl.trim()) {
      setIsPresenting(true);
    }
  };

  const handleStopPresentation = () => {
    setIsPresenting(false);
  };

  if (isPresenting) {
    return (
      <PresentationScreen 
        presentationUrl={presentationUrl}
        onExit={handleStopPresentation}
      />
    );
  }

  return (
    <div className="App">
      <div className="url-input-container">
        <h1>プレゼンテーション指定画面</h1>
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
}

export default App;