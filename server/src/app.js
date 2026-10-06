import express from 'express';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exchangeRoutes from './routes/exchangeRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createSessionMiddleware } from './middleware/session.js';

const app = express();

app.use(express.json());
app.use(createSessionMiddleware());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exchanges', exchangeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
