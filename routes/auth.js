const crypto = require('crypto');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const sendResponse = (res, statusCode, success, message, data = {}) =>
  res.status(statusCode).json({
    success,
    message,
    data,
  });

const isValidEmail = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const email = value.trim();
  const atIndex = email.indexOf('@');

  if (!email || atIndex <= 0 || atIndex !== email.lastIndexOf('@') || atIndex === email.length - 1) {
    return false;
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  const dotIndex = domainPart.indexOf('.');

  return Boolean(localPart) && dotIndex > 0 && dotIndex < domainPart.length - 1 && !domainPart.includes(' ');
};

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    data: {},
  },
});

const validateRegistration = ({ firstName, lastName, email, password }) => {
  if (!firstName || !lastName || !email || !password) {
    return 'firstName, lastName, email, and password are required';
  }

  if (!isValidEmail(email)) {
    return 'A valid email address is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
};

router.post('/register', authRateLimit, async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const validationError = validateRegistration({ firstName, lastName, email, password });

    if (validationError) {
      return sendResponse(res, 400, false, validationError);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return sendResponse(res, 400, false, 'A user with this email already exists');
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
    });

    const token = createToken(user);

    return sendResponse(res, 201, true, 'User registered successfully', {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, false, 'Email and password are required');
    }

    if (!isValidEmail(email)) {
      return sendResponse(res, 400, false, 'A valid email address is required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    const token = createToken(user);

    return sendResponse(res, 200, true, 'Login successful', {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/forgot-password', authRateLimit, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return sendResponse(res, 400, false, 'A valid email address is required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    return sendResponse(res, 200, true, 'Password reset token generated successfully', {
      resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
      expiresAt: user.resetPasswordExpires,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password', authRateLimit, async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return sendResponse(res, 400, false, 'Reset token and new password are required');
    }

    if (password.length < 6) {
      return sendResponse(res, 400, false, 'Password must be at least 6 characters long');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires +password');

    if (!user) {
      return sendResponse(res, 400, false, 'Reset token is invalid or has expired');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendResponse(res, 200, true, 'Password reset successfully', {
      token: createToken(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/verify', authRateLimit, protect, async (req, res) =>
  sendResponse(res, 200, true, 'Token is valid', {
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  })
);

module.exports = router;
