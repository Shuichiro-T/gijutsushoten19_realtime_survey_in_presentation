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
  
  if (frontendUrl) {
    return [frontendUrl, ...defaultOrigins];
  }
  
  return defaultOrigins;
};

// Socket.IO設定
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ミドルウェア設定
app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
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