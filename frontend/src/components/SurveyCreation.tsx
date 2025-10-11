import React, { useState } from 'react';
import './SurveyCreation.css';
import { getApiUrl } from '../utils/api';

interface SurveyCreationProps {
  eventId: string;
  eventTitle: string;
  onBack: () => void;
  onSurveyCreated: (surveyId: string, surveyTitle: string) => void;
}

interface SurveyOption {
  id: string;
  text: string;
}

const SurveyCreation: React.FC<SurveyCreationProps> = ({
  eventId,
  eventTitle,
  onBack,
  onSurveyCreated
}) => {
  const [title, setTitle] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<SurveyOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [createdSurvey, setCreatedSurvey] = useState<{surveyId: string, title: string} | null>(null);

  const addOption = () => {
    const newId = (Math.max(...options.map(opt => parseInt(opt.id))) + 1).toString();
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('アンケートタイトルを入力してください');
      return false;
    }
    if (!question.trim()) {
      setError('質問を入力してください');
      return false;
    }
    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      setError('選択肢を2つ以上入力してください');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const validOptions = options
        .filter(option => option.text.trim())
        .map(option => option.text.trim());

      const response = await fetch(getApiUrl('/api/surveys'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          title: title.trim(),
          question: question.trim(),
          options: validOptions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedSurvey({
          surveyId: data.data.surveyId,
          title: data.data.title
        });
      } else {
        setError(data.error || 'アンケートの作成に失敗しました');
      }
    } catch (error) {
      console.error('Error creating survey:', error);
      setError('サーバーとの通信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSurveyUrl = (surveyId: string): string => {
    const currentHost = window.location.origin;
    return `${currentHost}/events/${eventId}/surveys/${surveyId}`;
  };

  const generateQRCodeUrl = (url: string): string => {
    // QR Server API を使用してQRコードを生成
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const handleBackToList = () => {
    if (createdSurvey) {
      onSurveyCreated(createdSurvey.surveyId, createdSurvey.title);
    } else {
      onBack();
    }
  };

  // アンケート作成成功後の画面
  if (createdSurvey) {
    const surveyUrl = generateSurveyUrl(createdSurvey.surveyId);
    const qrCodeUrl = generateQRCodeUrl(surveyUrl);

    return (
      <div className="survey-creation">
        <div className="survey-creation-container">
          <h1>アンケート作成完了</h1>
          
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>アンケートが作成されました！</h2>
            <p><strong>アンケートタイトル:</strong> {createdSurvey.title}</p>
          </div>

          <div className="survey-url-section">
            <h3>回答用URL</h3>
            <div className="url-display">
              <input 
                type="text" 
                value={surveyUrl} 
                readOnly 
                className="url-input"
                onClick={(e) => e.currentTarget.select()}
              />
              <button 
                onClick={() => navigator.clipboard.writeText(surveyUrl)}
                className="copy-button"
                title="URLをコピー"
              >
                コピー
              </button>
            </div>
          </div>

          <div className="qr-code-section">
            <h3>QRコード</h3>
            <div className="qr-code-container">
              <img 
                src={qrCodeUrl} 
                alt="アンケート回答用QRコード" 
                className="qr-code-image"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5RUuOCs+ODvOODieOBruWPluW+l+OBq+WkseaVl+OBl+OBvuOBl+OBnzwvdGV4dD48L3N2Zz4=';
                }}
              />
              <p className="qr-code-caption">スマートフォンでQRコードを読み取ってアンケートに回答できます</p>
            </div>
          </div>

          <div className="instructions">
            <h3>参加者への案内方法:</h3>
            <ul>
              <li>上記のURLを参加者に共有してください</li>
              <li>QRコードをプレゼンテーション画面に表示することもできます</li>
              <li>参加者はスマートフォンやPCからアンケートに回答できます</li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleBackToList}
              className="back-button"
            >
              イベント管理に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-creation">
      <div className="survey-creation-container">
        <h1>アンケート作成</h1>
        
        <div className="event-info">
          <p><strong>イベント:</strong> {eventTitle}</p>
          <p><strong>イベントID:</strong> {eventId}</p>
        </div>

        <form onSubmit={handleSubmit} className="survey-form">
          <div className="form-group">
            <label htmlFor="survey-title">アンケートタイトル <span className="required">*</span></label>
            <input
              id="survey-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 今日のプレゼンテーションについて"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="survey-question">質問 <span className="required">*</span></label>
            <textarea
              id="survey-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例: 今日のプレゼンテーションの内容はいかがでしたか？"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>選択肢 <span className="required">*</span></label>
            <div className="options-container">
              {options.map((option, index) => (
                <div key={option.id} className="option-input-group">
                  <span className="option-number">{index + 1}.</span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`選択肢 ${index + 1}`}
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="remove-option-button"
                      disabled={isSubmitting}
                      title="この選択肢を削除"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="add-option-button"
                disabled={isSubmitting}
              >
                + 選択肢を追加
              </button>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onBack}
              className="back-button"
              disabled={isSubmitting}
            >
              戻る
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'アンケートを作成中...' : 'アンケートを作成'}
            </button>
          </div>
        </form>

        <div className="tips">
          <h3>アンケート作成のコツ:</h3>
          <ul>
            <li>質問は明確で理解しやすい表現にしましょう</li>
            <li>選択肢は重複しないよう注意してください</li>
            <li>回答者が選びやすい適切な数の選択肢を用意しましょう</li>
            <li>プレゼンテーションの内容に関連した質問にしましょう</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SurveyCreation;