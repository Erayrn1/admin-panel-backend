const express = require('express');

const User = require('../models/User');
const { authorize, protect } = require('../middleware/auth');

const router = express.Router();

const sendResponse = (res, statusCode, success, message, data = {}) =>
  res.status(statusCode).json({
    success,
    message,
    data,
  });

router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, 'Users fetched successfully', { users });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
