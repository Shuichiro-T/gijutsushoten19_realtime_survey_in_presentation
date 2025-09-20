import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SurveyResponse.css';

interface Question {
  id: string;
  type: 'multiple_choice' | 'rating' | 'text';
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  status: 'active' | 'inactive' | 'ended';
}

interface SurveyAnswer {
  questionId: string;
  answer: string | number | string[];
}

const SurveyResponse: React.FC = () => {
  const { eventId, surveyId } = useParams<{ eventId: string; surveyId: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        
        // アンケートが存在しない、または終了している場合のエラーハンドリング
        if (!surveyId || !eventId) {
          setError('アンケートIDまたはイベントIDが無効です');
          return;
        }

        // APIからアンケートデータを取得
        // 開発環境ではプロキシ設定により /api が自動的にバックエンドに転送される
        const response = await fetch(`/api/surveys/events/${eventId}/surveys/${surveyId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('指定されたアンケートが見つかりません');
          } else {
            setError('アンケートの取得に失敗しました');
          }
          return;
        }

        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'アンケートの取得に失敗しました');
          return;
        }

        // APIレスポンスを内部のSurvey型に変換
        const apiSurvey = data.data;
        const convertedSurvey: Survey = {
          id: apiSurvey.surveyId,
          title: apiSurvey.title,
          description: apiSurvey.event?.title,
          status: 'active', // 現在は選択肢アンケートのみ対応のため、固定でactive
          questions: [
            {
              id: 'main',
              type: 'multiple_choice',
              title: apiSurvey.question,
              required: true,
              options: apiSurvey.options.map((option: any) => option.text)
            }
          ]
        };

        setSurvey(convertedSurvey);
        
        // 回答を初期化
        const initialAnswers: SurveyAnswer[] = convertedSurvey.questions.map(q => ({
          questionId: q.id,
          answer: q.type === 'multiple_choice' ? '' : q.type === 'rating' ? 0 : ''
        }));
        setAnswers(initialAnswers);
        
      } catch (err) {
        console.error('Survey fetch error:', err);
        setError('アンケートの読み込み中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [eventId, surveyId]);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => 
      prev.map(answer => 
        answer.questionId === questionId 
          ? { ...answer, answer: value }
          : answer
      )
    );
    
    // バリデーションエラーをクリア
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateAnswers = (): boolean => {
    if (!survey) return false;
    
    const errors: { [key: string]: string } = {};
    
    survey.questions.forEach(question => {
      if (question.required) {
        const answer = answers.find(a => a.questionId === question.id)?.answer;
        
        if (!answer || (typeof answer === 'string' && answer.trim() === '') || 
            (typeof answer === 'number' && answer === 0)) {
          errors[question.id] = 'この項目は必須です';
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAnswers() || !survey) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // アンケート回答の送信
      const mainAnswer = answers.find(a => a.questionId === 'main');
      if (!mainAnswer || !mainAnswer.answer) {
        setError('回答が選択されていません');
        return;
      }

      // 選択された回答に対応する選択肢IDを取得
      // APIレスポンスから選択肢情報を取得するため、再度APIを呼び出す
      const surveyResponse = await fetch(`/api/surveys/events/${eventId}/surveys/${surveyId}`);
      if (!surveyResponse.ok) {
        setError('アンケート情報の取得に失敗しました');
        return;
      }
      
      const surveyData = await surveyResponse.json();
      const selectedOption = surveyData.data.options.find((option: any) => option.text === mainAnswer.answer);
      
      if (!selectedOption) {
        setError('選択された回答が無効です');
        return;
      }

      // 回答を送信
      const response = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          surveyId,
          optionId: selectedOption.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || '回答の送信に失敗しました');
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || '回答の送信に失敗しました');
        return;
      }
      
      setSubmitted(true);
      
    } catch (err) {
      console.error('Submit error:', err);
      setError('回答の送信中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const answer = answers.find(a => a.questionId === question.id);
    const hasError = validationErrors[question.id];
    
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div key={question.id} className={`question-container ${hasError ? 'error' : ''}`}>
            <h3 className="question-title">
              {question.title}
              {question.required && <span className="required">*</span>}
            </h3>
            {question.description && (
              <p className="question-description">{question.description}</p>
            )}
            <div className="options-container">
              {question.options?.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answer?.answer === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="option-input"
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
            {hasError && <div className="error-message">{validationErrors[question.id]}</div>}
          </div>
        );
        
      case 'rating':
        return (
          <div key={question.id} className={`question-container ${hasError ? 'error' : ''}`}>
            <h3 className="question-title">
              {question.title}
              {question.required && <span className="required">*</span>}
            </h3>
            {question.description && (
              <p className="question-description">{question.description}</p>
            )}
            <div className="rating-container">
              {Array.from({ length: question.maxRating || 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <label key={value} className="rating-label">
                    <input
                      type="radio"
                      name={question.id}
                      value={value}
                      checked={answer?.answer === value}
                      onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                      className="rating-input"
                    />
                    <span className="rating-number">{value}</span>
                  </label>
                );
              })}
            </div>
            <div className="rating-labels">
              <span>低い</span>
              <span>高い</span>
            </div>
            {hasError && <div className="error-message">{validationErrors[question.id]}</div>}
          </div>
        );
        
      case 'text':
        return (
          <div key={question.id} className={`question-container ${hasError ? 'error' : ''}`}>
            <h3 className="question-title">
              {question.title}
              {question.required && <span className="required">*</span>}
            </h3>
            {question.description && (
              <p className="question-description">{question.description}</p>
            )}
            <textarea
              value={answer?.answer as string || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="ご意見をお聞かせください..."
              className="text-input"
              rows={4}
            />
            {hasError && <div className="error-message">{validationErrors[question.id]}</div>}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="survey-response">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>アンケートを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="survey-response">
        <div className="error-container">
          <h2>エラーが発生しました</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="back-button"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="survey-response">
        <div className="success-container">
          <h2>回答ありがとうございました！</h2>
          <p>アンケートの回答が正常に送信されました。</p>
          <div className="success-icon">✓</div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="survey-response">
        <div className="error-container">
          <h2>アンケートが見つかりません</h2>
          <p>指定されたアンケートは存在しないか、アクセスできません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-response">
      <div className="survey-container">
        <div className="survey-header">
          <h1 className="survey-title">{survey.title}</h1>
          {survey.description && (
            <p className="survey-description">{survey.description}</p>
          )}
          <div className="survey-info">
            <span className="event-id">イベントID: {eventId}</span>
          </div>
        </div>
        
        <form className="survey-form" onSubmit={(e) => e.preventDefault()}>
          {survey.questions.map(renderQuestion)}
          
          <div className="submit-container">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? '送信中...' : '回答を送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyResponse;