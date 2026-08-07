const connectDB = require('../config/database');
const { app } = require('../server');

let dbConnectionPromise;

module.exports = async (req, res) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDB();
    }

    await dbConnectionPromise;
    return app(req, res);
  } catch (error) {
    dbConnectionPromise = null;

    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      data: {},
    });
  }
};
