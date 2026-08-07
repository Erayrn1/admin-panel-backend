const express = require('express');
const { rateLimit } = require('express-rate-limit');

const Reservation = require('../models/Reservation');
const User = require('../models/User');
const { authorize, protect } = require('../middleware/auth');

const router = express.Router();

const sendResponse = (res, statusCode, success, message, data = {}) =>
  res.status(statusCode).json({
    success,
    message,
    data,
  });

const dashboardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    data: {},
  },
});

router.get('/', dashboardRateLimit, protect, authorize('admin'), async (req, res, next) => {
  try {
    const [totalUsers, totalReservations, statusCounts, revenue] = await Promise.all([
      User.countDocuments({}),
      Reservation.countDocuments({}),
      Reservation.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Reservation.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
          },
        },
      ]),
    ]);

    const stats = {
      totalUsers,
      totalReservations,
      pendingReservations: 0,
      confirmedReservations: 0,
      cancelledReservations: 0,
      totalRevenue: revenue[0]?.totalRevenue || 0,
    };

    statusCounts.forEach((entry) => {
      if (entry._id === 'pending') stats.pendingReservations = entry.count;
      if (entry._id === 'confirmed') stats.confirmedReservations = entry.count;
      if (entry._id === 'cancelled') stats.cancelledReservations = entry.count;
    });

    return sendResponse(res, 200, true, 'Dashboard statistics fetched successfully', { stats });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
