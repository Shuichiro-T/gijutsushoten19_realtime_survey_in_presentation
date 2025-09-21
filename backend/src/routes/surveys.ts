import { Router, Request, Response } from 'express';
import prisma from '../database/client';
import { generateEventId, generateSurveyId, generateUserToken } from '../utils/idGenerator';

const router = Router();

// イベント作成
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const eventId = generateEventId();
    
    const event = await prisma.event.create({
      data: {
        eventId,
        title: title || `Event ${eventId}`,
      },
    });
    
    res.json({
      success: true,
      data: {
        eventId: event.eventId,
        title: event.title,
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'イベントの作成に失敗しました',
    });
  }
});

// アンケート作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const { eventId, title, question, options } = req.body;
    
    if (!eventId || !title || !question || !options || !Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        error: '必要なパラメータが不足しています',
      });
    }
    
    // イベントの存在確認
    const event = await prisma.event.findUnique({
      where: { eventId },
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'イベントが見つかりません',
      });
    }
    
    const surveyId = generateSurveyId();
    
    // アンケートと選択肢を同時に作成
    const survey = await prisma.survey.create({
      data: {
        surveyId,
        eventId,
        title,
        question,
        options: {
          create: options.map((option: string, index: number) => ({
            text: option,
            order: index + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    res.json({
      success: true,
      data: {
        surveyId: survey.surveyId,
        eventId: survey.eventId,
        title: survey.title,
        question: survey.question,
        options: survey.options,
        createdAt: survey.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({
      success: false,
      error: 'アンケートの作成に失敗しました',
    });
  }
});

// イベントのアンケート一覧取得
router.get('/events/:eventId/surveys', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // イベントの存在確認
    const event = await prisma.event.findUnique({
      where: { eventId },
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'イベントが見つかりません',
      });
    }
    
    // イベントに紐づく全アンケートを取得
    const surveys = await prisma.survey.findMany({
      where: {
        eventId,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    res.json({
      success: true,
      data: {
        eventId,
        surveys: surveys.map(survey => ({
          surveyId: survey.surveyId,
          title: survey.title,
          question: survey.question,
          options: survey.options,
          createdAt: survey.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching surveys for event:', error);
    res.status(500).json({
      success: false,
      error: 'アンケート一覧の取得に失敗しました',
    });
  }
});

// アンケート取得
router.get('/events/:eventId/surveys/:surveyId', async (req: Request, res: Response) => {
  try {
    const { eventId, surveyId } = req.params;
    
    const survey = await prisma.survey.findFirst({
      where: {
        surveyId,
        eventId,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        event: true,
      },
    });
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'アンケートが見つかりません',
      });
    }
    
    res.json({
      success: true,
      data: {
        surveyId: survey.surveyId,
        eventId: survey.eventId,
        title: survey.title,
        question: survey.question,
        options: survey.options,
        event: {
          title: survey.event.title,
        },
        createdAt: survey.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({
      success: false,
      error: 'アンケートの取得に失敗しました',
    });
  }
});

// アンケート結果取得
router.get('/events/:eventId/surveys/:surveyId/results', async (req: Request, res: Response) => {
  try {
    const { eventId, surveyId } = req.params;
    
    // アンケートの存在確認
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
      return res.status(404).json({
        success: false,
        error: 'アンケートが見つかりません',
      });
    }
    
    // 各選択肢の回答数を取得
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
    
    res.json({
      success: true,
      data: {
        surveyId: survey.surveyId,
        eventId: survey.eventId,
        title: survey.title,
        question: survey.question,
        totalResponses,
        results,
      },
    });
  } catch (error) {
    console.error('Error fetching survey results:', error);
    res.status(500).json({
      success: false,
      error: 'アンケート結果の取得に失敗しました',
    });
  }
});

// 回答送信
router.post('/responses', async (req: Request, res: Response) => {
  try {
    const { eventId, surveyId, optionId, userToken } = req.body;
    
    if (!eventId || !surveyId || !optionId) {
      return res.status(400).json({
        success: false,
        error: '必要なパラメータが不足しています',
      });
    }
    
    // アンケートの存在確認
    const survey = await prisma.survey.findFirst({
      where: {
        surveyId,
        eventId,
      },
    });
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'アンケートが見つかりません',
      });
    }
    
    // 選択肢の存在確認
    const option = await prisma.surveyOption.findFirst({
      where: {
        id: optionId,
        surveyId: survey.surveyId,
      },
    });
    
    if (!option) {
      return res.status(404).json({
        success: false,
        error: '選択肢が見つかりません',
      });
    }
    
    // ユーザートークンの生成（提供されていない場合）
    const responseUserToken = userToken || generateUserToken();
    
    // 回答を保存
    const response = await prisma.response.create({
      data: {
        surveyId: survey.surveyId,
        surveyOptionId: optionId,
        userToken: responseUserToken,
      },
    });
    
    res.json({
      success: true,
      data: {
        responseId: response.id,
        userToken: responseUserToken,
        submittedAt: response.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({
      success: false,
      error: '回答の送信に失敗しました',
    });
  }
});

export default router;