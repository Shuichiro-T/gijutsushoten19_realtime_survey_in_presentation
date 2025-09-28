import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import surveyRoutes from './routes/surveys';
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const server = createServer(app);

// CORS設定用の関数
const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  const defaultOrigins = ["http://localhost:3000"];
  
  if (frontendUrl && frontendUrl !== 'https://placeholder-frontend-url') {
    return [frontendUrl, ...defaultOrigins];
  }
  
  // Cloud Run環境での動的ドメイン対応
  if (process.env.NODE_ENV === 'production') {
    // Google Cloud Runのドメインパターンに一致する場合は許可
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        // same-originリクエストを許可
        return callback(null, true);
      }
      
      // ローカル開発環境
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Google Cloud Runドメイン
      if (origin.includes('.run.app') || origin.includes('.a.run.app')) {
        return callback(null, true);
      }
      
      // 設定されたフロントエンドURL
      if (frontendUrl && origin === frontendUrl) {
        return callback(null, true);
      }
      
      // その他は拒否
      console.warn(`CORS: Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    };
  }
  
  return defaultOrigins;
};

// Socket.IO設定
const allowedOrigins = getAllowedOrigins();
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ミドルウェア設定
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティング設定
app.use('/api/surveys', surveyRoutes);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'realtime-survey-backend',
  });
});

// Socket.IOハンドラー設定
setupSocketHandlers(io);

// サーバー起動
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO endpoint: http://localhost:${PORT}`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});