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
    // TODO: 実際のAPIからアンケートデータを取得
    // 現在はモックデータで動作確認
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        
        // モックデータ
        const mockSurvey: Survey = {
          id: surveyId || '',
          title: 'プレゼンテーションに関するアンケート',
          description: 'プレゼンテーションの内容について教えてください',
          status: 'active',
          questions: [
            {
              id: '1',
              type: 'multiple_choice',
              title: 'プレゼンテーションの理解度はいかがでしたか？',
              required: true,
              options: ['とてもよく理解できた', 'まあまあ理解できた', 'あまり理解できなかった', '全く理解できなかった']
            },
            {
              id: '2',
              type: 'rating',
              title: 'プレゼンテーションの満足度を5段階で評価してください',
              required: true,
              minRating: 1,
              maxRating: 5
            },
            {
              id: '3',
              type: 'text',
              title: 'ご意見・ご感想をお聞かせください',
              description: '改善点や気になった点があれば自由にお書きください',
              required: false
            }
          ]
        };

        // アンケートが存在しない、または終了している場合のエラーハンドリング
        if (!surveyId || !eventId) {
          setError('アンケートIDまたはイベントIDが無効です');
          return;
        }

        if (mockSurvey.status === 'ended') {
          setError('このアンケートは既に終了しています');
          return;
        }

        if (mockSurvey.status === 'inactive') {
          setError('このアンケートはまだ開始されていません');
          return;
        }

        setSurvey(mockSurvey);
        
        // 回答を初期化
        const initialAnswers: SurveyAnswer[] = mockSurvey.questions.map(q => ({
          questionId: q.id,
          answer: q.type === 'multiple_choice' ? '' : q.type === 'rating' ? 0 : ''
        }));
        setAnswers(initialAnswers);
        
      } catch (err) {
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
    if (!validateAnswers()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // TODO: 実際のAPIに回答を送信
      // 現在はモック送信
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('アンケート回答:', {
        eventId,
        surveyId,
        answers
      });
      
      setSubmitted(true);
      
    } catch (err) {
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