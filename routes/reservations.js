const express = require('express');
const mongoose = require('mongoose');

const Reservation = require('../models/Reservation');
const { authorize, protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

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

const isValidPhoneNumber = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  if (trimmed.length < 7 || trimmed.length > 20) {
    return false;
  }

  let digitCount = 0;

  for (const character of trimmed) {
    const isDigit = character >= '0' && character <= '9';
    if (isDigit) {
      digitCount += 1;
      continue;
    }

    if (!['+', '(', ')', '-', ' '].includes(character)) {
      return false;
    }
  }

  return digitCount >= 7;
};

router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    keyPrefix: 'reservations',
  })
);

const validateReservationPayload = (payload, { partial = false } = {}) => {
  const requiredFields = ['date', 'time', 'numberOfPeople', 'phoneNumber', 'email'];

  if (!partial) {
    const missingField = requiredFields.find((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
    if (missingField) {
      return `${missingField} is required`;
    }
  }

  if (payload.date !== undefined && Number.isNaN(new Date(payload.date).getTime())) {
    return 'A valid reservation date is required';
  }

  if (payload.time !== undefined && typeof payload.time !== 'string') {
    return 'time must be a string';
  }

  if (payload.numberOfPeople !== undefined) {
    const people = Number(payload.numberOfPeople);
    if (!Number.isInteger(people) || people < 1) {
      return 'numberOfPeople must be a positive integer';
    }
  }

  if (payload.phoneNumber !== undefined && !isValidPhoneNumber(payload.phoneNumber)) {
    return 'A valid phone number is required';
  }

  if (payload.email !== undefined && !isValidEmail(payload.email)) {
    return 'A valid email address is required';
  }

  if (payload.status !== undefined && !['pending', 'confirmed', 'cancelled'].includes(payload.status)) {
    return 'status must be pending, confirmed, or cancelled';
  }

  if (payload.price !== undefined && (Number.isNaN(Number(payload.price)) || Number(payload.price) < 0)) {
    return 'price must be a non-negative number';
  }

  return null;
};

const canAccessReservation = (user, reservation) =>
  user.role === 'admin' || reservation.userId.toString() === user._id.toString();

router.get('/', protect, async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const reservations = await Reservation.find(query).sort({ date: 1, time: 1 });

    return sendResponse(res, 200, true, 'Reservations fetched successfully', {
      reservations,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const validationError = validateReservationPayload(req.body);

    if (validationError) {
      return sendResponse(res, 400, false, validationError);
    }

    const reservation = await Reservation.create({
      userId: req.user._id,
      date: new Date(req.body.date),
      time: req.body.time.trim(),
      numberOfPeople: Number(req.body.numberOfPeople),
      phoneNumber: req.body.phoneNumber.trim(),
      email: req.body.email.toLowerCase().trim(),
      status: req.body.status || 'pending',
      price: req.body.price !== undefined ? Number(req.body.price) : 0,
      notes: req.body.notes ? req.body.notes.trim() : '',
    });

    return sendResponse(res, 201, true, 'Reservation created successfully', {
      reservation,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/stats/overview', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [totals] = await Reservation.aggregate([
      {
        $group: {
          _id: null,
          totalReservations: { $sum: 1 },
          pendingReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          confirmedReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          cancelledReservations: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          totalRevenue: { $sum: '$price' },
        },
      },
    ]);

    return sendResponse(res, 200, true, 'Reservation statistics fetched successfully', {
      stats: totals || {
        totalReservations: 0,
        pendingReservations: 0,
        confirmedReservations: 0,
        cancelledReservations: 0,
        totalRevenue: 0,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, 'Invalid reservation ID');
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return sendResponse(res, 404, false, 'Reservation not found');
    }

    if (!canAccessReservation(req.user, reservation)) {
      return sendResponse(res, 403, false, 'You do not have permission to access this reservation');
    }

    return sendResponse(res, 200, true, 'Reservation fetched successfully', {
      reservation,
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, 'Invalid reservation ID');
    }

    const validationError = validateReservationPayload(req.body, { partial: true });
    if (validationError) {
      return sendResponse(res, 400, false, validationError);
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return sendResponse(res, 404, false, 'Reservation not found');
    }

    if (!canAccessReservation(req.user, reservation)) {
      return sendResponse(res, 403, false, 'You do not have permission to update this reservation');
    }

    const updates = {
      ...(req.body.date !== undefined ? { date: new Date(req.body.date) } : {}),
      ...(req.body.time !== undefined ? { time: req.body.time.trim() } : {}),
      ...(req.body.numberOfPeople !== undefined ? { numberOfPeople: Number(req.body.numberOfPeople) } : {}),
      ...(req.body.phoneNumber !== undefined ? { phoneNumber: req.body.phoneNumber.trim() } : {}),
      ...(req.body.email !== undefined ? { email: req.body.email.toLowerCase().trim() } : {}),
      ...(req.body.status !== undefined ? { status: req.body.status } : {}),
      ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
      ...(req.body.notes !== undefined ? { notes: req.body.notes.trim() } : {}),
    };

    Object.assign(reservation, updates);
    await reservation.save();

    return sendResponse(res, 200, true, 'Reservation updated successfully', {
      reservation,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, 'Invalid reservation ID');
    }

    const reservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!reservation) {
      return sendResponse(res, 404, false, 'Reservation not found');
    }

    return sendResponse(res, 200, true, 'Reservation deleted successfully');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
