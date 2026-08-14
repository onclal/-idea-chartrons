import cors from 'cors';
import express from 'express';
import acteursRouter from './routes/acteurs.js';
import eventsRouter from './routes/events.js';
import fideliteRouter from './routes/fidelite.js';
import postsRouter from './routes/posts.js';
import relaisRouter from './routes/relais.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'IDÉA CHARTRONS', version: '1.0.0' });
});

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/acteurs', acteursRouter);
app.use('/api/events', eventsRouter);
app.use('/api/relais', relaisRouter);
app.use('/api/fidelite', fideliteRouter);

app.listen(PORT, () => {
  console.log(`🏘️  IDÉA CHARTRONS API running on http://localhost:${PORT}`);
});
