import express from 'express';
import request from 'supertest';
import englishLabRoutes from '../src/routes/englishLab';

async function main() {
  const app = express();
  app.use(express.json());
  app.use('/api/v2/english-lab', englishLabRoutes);

  const status = await request(app)
    .get('/api/v2/english-lab/phase2/status?userId=smoke_route&lessonSize=10&phraseLimitPerWord=2&grammarLimit=5');
  const home = await request(app)
    .get('/api/v2/english-lab/phase2/home?userId=smoke_route&lessonSize=10&phraseLimitPerWord=2&grammarLimit=5');
  const quiz = await request(app)
    .get('/api/v2/english-lab/quiz/next?userId=smoke_route');

  const payload = {
    statusCode: status.status,
    statusMessage: status.body?.message ?? null,
    statusStage: status.body?.data?.phase2Flow?.stage ?? null,
    homeCode: home.status,
    homeMessage: home.body?.message ?? null,
    phraseItems: home.body?.data?.phase2Home?.phrasePack?.items?.length ?? null,
    grammarItems: home.body?.data?.phase2Home?.grammarPack?.items?.length ?? null,
    quizCode: quiz.status,
    quizMessage: quiz.body?.message ?? null,
    quizWord: quiz.body?.data?.item?.word ?? null,
    ok: status.status === 200 && home.status === 200 && quiz.status === 200,
  };

  console.log(JSON.stringify(payload, null, 2));

  if (!payload.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
