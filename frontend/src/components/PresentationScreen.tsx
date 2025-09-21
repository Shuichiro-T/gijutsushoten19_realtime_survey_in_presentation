import React, { useEffect, useRef, useState } from 'react';
import './PresentationScreen.css';

interface PresentationScreenProps {
  presentationUrl: string;
  eventId?: string;
  onExit: () => void;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null);
  
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
        case 'c':
        case 'C':
          // Cキーで四角をクリア
          setRectangles([]);
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

  // キャンバス上での描画処理
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 下部5%の領域では描画を開始しない
    const canvasHeight = canvas.height;
    const drawableHeight = canvasHeight * 0.95;
    if (y > drawableHeight) {
      return;
    }

    setIsDrawing(true);
    setStartPosition({ x, y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPosition) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    let currentY = event.clientY - rect.top;

    // 下部5%の領域に描画されないように制限
    const canvasHeight = canvas.height;
    const drawableHeight = canvasHeight * 0.95;
    currentY = Math.min(currentY, drawableHeight);

    // 現在の四角を一時的に表示
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 既存の四角を描画
      rectangles.forEach(rectangle => {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      });

      // 現在描画中の四角
      const width = currentX - startPosition.x;
      const height = currentY - startPosition.y;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(startPosition.x, startPosition.y, width, height);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(startPosition.x, startPosition.y, width, height);
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPosition) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const endX = event.clientX - rect.left;
    let endY = event.clientY - rect.top;

    // 下部5%の領域に描画されないように制限
    const canvasHeight = canvas.height;
    const drawableHeight = canvasHeight * 0.95;
    endY = Math.min(endY, drawableHeight);

    const newRectangle: Rectangle = {
      x: Math.min(startPosition.x, endX),
      y: Math.min(startPosition.y, endY),
      width: Math.abs(endX - startPosition.x),
      height: Math.abs(endY - startPosition.y)
    };

    // 下部5%領域に侵入しないよう最終調整
    if (newRectangle.y + newRectangle.height > drawableHeight) {
      newRectangle.height = drawableHeight - newRectangle.y;
    }

    // 最小サイズの四角のみ追加
    if (newRectangle.width > 10 && newRectangle.height > 10) {
      setRectangles(prev => [...prev, newRectangle]);
    }

    setIsDrawing(false);
    setStartPosition(null);
  };

  // キャンバスの再描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    rectangles.forEach(rectangle => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    });
  }, [rectangles]);

  // ウィンドウリサイズ時のキャンバスサイズ調整
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFullscreen]);

  // イベントIDが提供されている場合、アンケート一覧を取得
  useEffect(() => {
    if (!eventId) return;

    const fetchSurveys = async () => {
      setIsLoadingSurveys(true);
      try {
        // アンケート一覧を取得するためのAPIエンドポイントを実装する必要があります
        // 現在は手動で既知のアンケートIDを使用
        console.log('イベントID取得:', eventId);
      } catch (error) {
        console.error('アンケート一覧の取得に失敗:', error);
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
          const response = await fetch(`/api/surveys/events/${survey.eventId}/surveys/${survey.surveyId}/results`);
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

  // アンケート結果を手動で追加する関数（テスト用）
  const addTestSurvey = (surveyId: string) => {
    if (!eventId) return;
    
    const testSurvey: Survey = {
      surveyId,
      eventId,
      title: `テストアンケート ${surveyId}`,
      question: `アンケート ${surveyId} の質問`,
      options: [
        { id: 1, text: 'オプション1', order: 1 },
        { id: 2, text: 'オプション2', order: 2 }
      ]
    };
    
    setSurveys(prev => {
      const exists = prev.some(s => s.surveyId === surveyId);
      if (!exists) {
        return [...prev, testSurvey];
      }
      return prev;
    });
  };

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
      
      {/* 描画用キャンバス */}
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          pointerEvents: 'all',
          // 下部5%領域でのクリックを無効化するためのclip-pathを使用
          clipPath: 'polygon(0 0, 100% 0, 100% 95%, 0 95%)'
        }}
      />

      {/* コントロールパネル */}
      {!isFullscreen && (
        <div className="control-panel">
          <button onClick={toggleFullscreen} className="control-button">
            全画面表示 (F11)
          </button>
          <button onClick={() => setRectangles([])} className="control-button">
            四角をクリア (C)
          </button>
          <button 
            onClick={() => setShowResults(!showResults)} 
            className={`control-button ${showResults ? 'active' : ''}`}
          >
            アンケート結果 (S)
          </button>
          {eventId && (
            <div className="survey-controls">
              <button 
                onClick={() => addTestSurvey('test1')} 
                className="control-button test-button"
              >
                テスト1追加
              </button>
              <button 
                onClick={() => addTestSurvey('test2')} 
                className="control-button test-button"
              >
                テスト2追加
              </button>
            </div>
          )}
          <button onClick={onExit} className="control-button exit-button">
            終了 (Esc)
          </button>
        </div>
      )}

      {/* 全画面時の簡易ヘルプ */}
      {isFullscreen && (
        <div className="fullscreen-help">
          <div className="help-item">マウスドラッグで四角を描画</div>
          <div className="help-item">C: クリア | S: アンケート結果 | Esc: 終了</div>
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