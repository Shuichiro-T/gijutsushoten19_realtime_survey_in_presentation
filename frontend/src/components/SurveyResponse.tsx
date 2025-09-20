import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SurveyResponse.css';

interface SurveyQuestion {
  id: string;
  title: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options?: string[];
  required: boolean;
}

interface Survey {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  isActive: boolean;
}

const SurveyResponse: React.FC = () => {
  const { eventId, surveyId } = useParams<{ eventId: string; surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // アンケートデータを取得
    fetchSurvey();
  }, [eventId, surveyId]);

  const fetchSurvey = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // TODO: 実際のAPIエンドポイントに置き換える
      // const response = await fetch(`/api/events/${eventId}/surveys/${surveyId}`);
      // const surveyData = await response.json();
      
      // モックデータ（開発用）
      const mockSurvey: Survey = {
        id: surveyId || '',
        eventId: eventId || '',
        title: 'プレゼンテーションに関するアンケート',
        description: 'このプレゼンテーションについてご意見をお聞かせください。',
        questions: [
          {
            id: 'q1',
            title: 'このプレゼンテーションの内容はわかりやすかったですか？',
            type: 'multiple-choice',
            options: ['とてもわかりやすい', 'わかりやすい', 'ふつう', 'わかりにくい', 'とてもわかりにくい'],
            required: true
          },
          {
            id: 'q2',
            title: '今回のプレゼンテーションを5段階で評価してください。',
            type: 'rating',
            required: true
          },
          {
            id: 'q3',
            title: 'ご意見・ご感想をお聞かせください（任意）',
            type: 'text',
            required: false
          }
        ],
        isActive: true
      };
      
      setSurvey(mockSurvey);
    } catch (err) {
      setError('アンケートの読み込みに失敗しました。しばらく経ってから再度お試しください。');
      console.error('Survey fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateAnswers = (): boolean => {
    if (!survey) return false;
    
    for (const question of survey.questions) {
      if (question.required && !answers[question.id]) {
        setError(`「${question.title}」は必須項目です。`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAnswers()) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // TODO: 実際のAPIエンドポイントに置き換える
      // const response = await fetch(`/api/events/${eventId}/surveys/${surveyId}/responses`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ answers })
      // });
      
      // モック送信（開発用）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
    } catch (err) {
      setError('回答の送信に失敗しました。しばらく経ってから再度お試しください。');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="question-options">
            {question.options?.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'rating':
        return (
          <div className="rating-options">
            {[1, 2, 3, 4, 5].map(rating => (
              <label key={rating} className="rating-label">
                <input
                  type="radio"
                  name={question.id}
                  value={rating.toString()}
                  checked={answers[question.id] === rating.toString()}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
                <span className="rating-number">{rating}</span>
              </label>
            ))}
            <div className="rating-labels">
              <span>低い</span>
              <span>高い</span>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <textarea
            className="text-input"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="ご意見をお聞かせください..."
            rows={4}
          />
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="survey-response">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>アンケートを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="survey-response">
        <div className="error-state">
          <h2>アンケートが見つかりません</h2>
          <p>指定されたアンケートが存在しないか、既に終了している可能性があります。</p>
          <button onClick={() => navigate('/')} className="back-button">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!survey.isActive) {
    return (
      <div className="survey-response">
        <div className="inactive-state">
          <h2>アンケートは終了しました</h2>
          <p>このアンケートは既に終了しています。</p>
          <button onClick={() => navigate('/')} className="back-button">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="survey-response">
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h2>回答を送信しました</h2>
          <p>ご回答いただき、ありがとうございました。</p>
          <button onClick={() => navigate('/')} className="back-button">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-response">
      <div className="survey-container">
        <div className="survey-header">
          <h1>{survey.title}</h1>
          {survey.description && (
            <p className="survey-description">{survey.description}</p>
          )}
          <div className="event-info">
            <span>イベントID: {eventId}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="survey-form">
          {survey.questions.map((question, index) => (
            <div key={question.id} className="question-container">
              <div className="question-header">
                <h3 className="question-title">
                  {index + 1}. {question.title}
                  {question.required && <span className="required-mark">*</span>}
                </h3>
              </div>
              <div className="question-content">
                {renderQuestion(question)}
              </div>
            </div>
          ))}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="submit-section">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? '送信中...' : '回答を送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyResponse;