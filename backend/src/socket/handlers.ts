import { Server, Socket } from 'socket.io';
import prisma from '../database/client';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    
    // アンケートの部屋に参加
    socket.on('join-survey', ({ eventId, surveyId }) => {
      const room = `${eventId}-${surveyId}`;
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
      
      // 現在の結果を送信
      getSurveyResults(eventId, surveyId).then((results) => {
        socket.emit('survey-results', results);
      });
    });
    
    // アンケートの部屋から退出
    socket.on('leave-survey', ({ eventId, surveyId }) => {
      const room = `${eventId}-${surveyId}`;
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });
    
    // 回答送信時の処理
    socket.on('submit-response', async ({ eventId, surveyId, optionId, userToken }) => {
      try {
        // アンケートの存在確認
        const survey = await prisma.survey.findFirst({
          where: {
            surveyId,
            eventId,
          },
        });
        
        if (!survey) {
          socket.emit('error', { message: 'アンケートが見つかりません' });
          return;
        }
        
        // 選択肢の存在確認
        const option = await prisma.surveyOption.findFirst({
          where: {
            id: optionId,
            surveyId: survey.surveyId,
          },
        });
        
        if (!option) {
          socket.emit('error', { message: '選択肢が見つかりません' });
          return;
        }
        
        // 回答を保存
        const response = await prisma.response.create({
          data: {
            surveyId: survey.surveyId,
            surveyOptionId: optionId,
            userToken: userToken || socket.id,
          },
        });
        
        // 成功レスポンス
        socket.emit('response-submitted', {
          responseId: response.id,
          submittedAt: response.submittedAt,
        });
        
        // 部屋の全参加者に更新された結果を送信
        const room = `${eventId}-${surveyId}`;
        const results = await getSurveyResults(eventId, surveyId);
        io.to(room).emit('survey-results', results);
        
      } catch (error) {
        console.error('Error submitting response:', error);
        socket.emit('error', { message: '回答の送信に失敗しました' });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

async function getSurveyResults(eventId: string, surveyId: string) {
  try {
    const survey = await prisma.survey.findFirst({
      where: {
        surveyId,
        eventId,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    if (!survey) {
      return null;
    }
    
    const results = await Promise.all(
      survey.options.map(async (option) => {
        const count = await prisma.response.count({
          where: {
            surveyOptionId: option.id,
          },
        });
        
        return {
          optionId: option.id,
          text: option.text,
          order: option.order,
          count,
        };
      })
    );
    
    const totalResponses = results.reduce((sum, result) => sum + result.count, 0);
    
    return {
      surveyId: survey.surveyId,
      eventId: survey.eventId,
      title: survey.title,
      question: survey.question,
      totalResponses,
      results,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error getting survey results:', error);
    return null;
  }
}