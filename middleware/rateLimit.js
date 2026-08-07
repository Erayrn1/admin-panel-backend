const requestBuckets = new Map();

const getClientKey = (req, keyPrefix) => `${keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;

const rateLimit = ({ windowMs, max, keyPrefix }) => (req, res, next) => {
  const now = Date.now();
  const bucketKey = getClientKey(req, keyPrefix);
  const bucket = requestBuckets.get(bucketKey);

  if (!bucket || now - bucket.startedAt >= windowMs) {
    requestBuckets.set(bucketKey, { count: 1, startedAt: now });
    return next();
  }

  if (bucket.count >= max) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      data: {},
    });
  }

  bucket.count += 1;
  return next();
};

module.exports = rateLimit;
