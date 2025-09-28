import React, { useEffect, useRef, useState } from 'react';
import './PresentationScreen.css';
import { getRelativeApiBase } from '../utils/api';

interface PresentationScreenProps {
  presentationUrl: string;
  eventId?: string;
  onExit: () => void;
}


interface SurveyResult {
  surveyId: string;
  eventId: string;
  title: string;
  question: string;
  totalResponses: number;
  results: {
    optionId: number;
    text: string;
    order: number;
    count: number;
  }[];
}

interface Survey {
  surveyId: string;
  eventId: string;
  title: string;
  question: string;
  options: {
    id: number;
    text: string;
    order: number;
  }[];
}

const PresentationScreen: React.FC<PresentationScreenProps> = ({
  presentationUrl,
  eventId,
  onExit
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // アンケート結果表示用の状態
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0);
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false);

  // Google SlidesのURLを埋め込み用URLに変換
  const getEmbedUrl = (url: string): string => {
    try {
      // Google SlidesのURLから埋め込み用URLを生成
      if (url.includes('docs.google.com/presentation')) {
        const presentationId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (presentationId) {
          return `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`;
        }
      }
      return url;
    } catch (error) {
      console.error('URL変換エラー:', error);
      return url;
    }
  };

  // 全画面モードの切り替え
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('全画面モードの切り替えエラー:', error);
    }
  };

  // キーボードイベントの処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onExit();
          }
          break;
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 's':
        case 'S':
          // Sキーでアンケート結果の表示・非表示を切り替え
          event.preventDefault();
          setShowResults(prev => !prev);
          break;
        case 'ArrowLeft':
          // 左矢印キーで前のアンケート結果
          if (showResults && surveyResults.length > 1) {
            event.preventDefault();
            setCurrentSurveyIndex(prev => 
              prev > 0 ? prev - 1 : surveyResults.length - 1
            );
          }
          break;
        case 'ArrowRight':
          // 右矢印キーで次のアンケート結果
          if (showResults && surveyResults.length > 1) {
            event.preventDefault();
            setCurrentSurveyIndex(prev => 
              prev < surveyResults.length - 1 ? prev + 1 : 0
            );
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onExit, showResults, surveyResults.length]);

  // 全画面状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);




  // イベントIDが提供されている場合、アンケート一覧を取得
  useEffect(() => {
    if (!eventId) return;

    const fetchSurveys = async () => {
      setIsLoadingSurveys(true);
      try {
        const response = await fetch(`${getRelativeApiBase()}/api/surveys/events/${eventId}/surveys`);
        const data = await response.json();
        
        if (data.success && data.data.surveys) {
          const fetchedSurveys: Survey[] = data.data.surveys.map((survey: any) => ({
            surveyId: survey.surveyId,
            eventId: eventId,
            title: survey.title,
            question: survey.question,
            options: survey.options
          }));
          setSurveys(fetchedSurveys);
          console.log(`イベントID ${eventId} から ${fetchedSurveys.length} 件のアンケートを取得しました`);
        } else {
          console.log('アンケートが見つかりませんでした');
          setSurveys([]);
        }
      } catch (error) {
        console.error('アンケート一覧の取得に失敗:', error);
        setSurveys([]);
      } finally {
        setIsLoadingSurveys(false);
      }
    };

    fetchSurveys();
  }, [eventId]);

  // アンケート結果のリアルタイム更新
  useEffect(() => {
    if (!showResults || surveys.length === 0) return;

    const fetchSurveyResults = async () => {
      try {
        const resultsPromises = surveys.map(async (survey) => {
          const response = await fetch(`${getRelativeApiBase()}/api/surveys/events/${survey.eventId}/surveys/${survey.surveyId}/results`);
          const data = await response.json();
          if (data.success) {
            return data.data;
          }
          return null;
        });

        const results = await Promise.all(resultsPromises);
        const validResults = results.filter(result => result !== null);
        setSurveyResults(validResults);
      } catch (error) {
        console.error('アンケート結果の取得に失敗:', error);
      }
    };

    fetchSurveyResults();

    // 5秒ごとにリアルタイム更新
    const interval = setInterval(fetchSurveyResults, 5000);
    return () => clearInterval(interval);
  }, [showResults, surveys]);


  // 現在表示中のアンケート結果を取得
  const getCurrentSurveyResult = (): SurveyResult | null => {
    if (surveyResults.length === 0 || currentSurveyIndex >= surveyResults.length) {
      return null;
    }
    return surveyResults[currentSurveyIndex];
  };

  // パーセンテージ計算
  const calculatePercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div 
      ref={containerRef}
      className={`presentation-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Google Slides埋め込み */}
      <iframe
        src={getEmbedUrl(presentationUrl)}
        className="presentation-iframe"
        frameBorder="0"
        allowFullScreen
        title="Google Slides Presentation"
      />
      

      {/* コントロールパネル */}
      {!isFullscreen && (
        <div className="control-panel">
          <button onClick={toggleFullscreen} className="control-button">
            全画面表示 (F11)
          </button>
          <button 
            onClick={() => setShowResults(!showResults)} 
            className={`control-button ${showResults ? 'active' : ''}`}
          >
            アンケート結果 (S)
          </button>
          <button onClick={onExit} className="control-button exit-button">
            終了 (Esc)
          </button>
        </div>
      )}

      {/* 全画面時の簡易ヘルプ */}
      {isFullscreen && (
        <div className="fullscreen-help">
          <div className="help-item">S: アンケート結果 | Esc: 終了</div>
          {showResults && surveyResults.length > 1 && (
            <div className="help-item">← → : アンケート切り替え</div>
          )}
        </div>
      )}

      {/* アンケート結果オーバーレイ */}
      {showResults && (
        <div className="survey-results-overlay">
          {getCurrentSurveyResult() ? (
            <div className="survey-results-content">
              <div className="survey-results-header">
                <h2>{getCurrentSurveyResult()!.title}</h2>
                <p className="survey-question">{getCurrentSurveyResult()!.question}</p>
                <p className="total-responses">
                  総回答数: {getCurrentSurveyResult()!.totalResponses}件
                </p>
                {surveyResults.length > 1 && (
                  <p className="survey-navigation">
                    {currentSurveyIndex + 1} / {surveyResults.length}
                  </p>
                )}
              </div>
              <div className="survey-results-list">
                {getCurrentSurveyResult()!.results.map((result) => {
                  const percentage = calculatePercentage(
                    result.count, 
                    getCurrentSurveyResult()!.totalResponses
                  );
                  return (
                    <div key={result.optionId} className="survey-result-item">
                      <div className="result-header">
                        <span className="option-text">{result.text}</span>
                        <span className="result-stats">
                          {result.count}件 ({percentage}%)
                        </span>
                      </div>
                      <div className="result-bar">
                        <div 
                          className="result-bar-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="survey-results-content">
              <div className="survey-results-header">
                <h2>アンケート結果</h2>
                <p className="no-surveys">
                  {isLoadingSurveys ? 'アンケートを読み込み中...' : 'アンケートがありません'}
                </p>
                {eventId && (
                  <p className="event-info">イベントID: {eventId}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PresentationScreen;