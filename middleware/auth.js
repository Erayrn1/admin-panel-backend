const jwt = require('jsonwebtoken');

const User = require('../models/User');

const formatError = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message,
    data: {},
  });

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return formatError(res, 401, 'Authorization token is required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return formatError(res, 401, 'Invalid authentication token');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return formatError(res, 401, 'Authentication token has expired');
    }

    if (error.name === 'JsonWebTokenError') {
      return formatError(res, 401, 'Invalid authentication token');
    }

    return next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return formatError(res, 401, 'Authentication required');
  }

  if (!roles.includes(req.user.role)) {
    return formatError(res, 403, 'You do not have permission to perform this action');
  }

  return next();
};

module.exports = {
  protect,
  authorize,
};
