function errorHandler(err, req, res, next) {
  if (err.isApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: err.errors?.[0]?.message || err.message,
      details: err.errors?.map((e) => e.message),
    });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'Foreign key constraint failed' });
  }
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = { errorHandler };
