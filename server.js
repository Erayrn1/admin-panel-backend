require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');

const app = express();

const allowedOrigins = Array.from(
  new Set(
    [process.env.FRONTEND_URL, 'https://admin-panel-9zcg-jet.vercel.app'].filter(Boolean)
  )
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS policy does not allow access from this origin'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }

  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    data: {},
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    data: {},
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.name === 'ValidationError' ? 400 : 500;
  const message = statusCode === 400 ? error.message : error.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    data: {},
  });
});

const startServer = async () => {
  await connectDB();

  const port = Number(process.env.PORT) || 5000;
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
