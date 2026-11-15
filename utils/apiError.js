// Consistent client-facing errors without leaking SQL, credentials or stack traces.
function describeError(error, fallbackStatus = 500) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return { status: 409, message: 'A record with these unique details already exists.' };
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return { status: 409, message: 'This record is linked to other data. Check the selected references or deactivate it instead of deleting it.' };
  }
  if (['SequelizeValidationError', 'SequelizeExclusionConstraintError'].includes(error.name)) {
    const errors = (error.errors || []).map(item => ({ field: item.path, message: item.message }));
    return { status: 400, message: 'Please correct the highlighted record details.', errors };
  }
  if (['22P02', '22007', '22008', '22003', '23502', '23514'].includes(error.original?.code)) {
    return { status: 400, message: 'A required field, number, date, or selection is invalid. Please check the form.' };
  }
  if (error.type === 'entity.parse.failed') return { status: 400, message: 'The request contains invalid JSON.' };
  if (error.type === 'entity.too.large') return { status: 413, message: 'The uploaded request is too large.' };
  return { status: fallbackStatus, message: fallbackStatus >= 500
    ? 'The server could not complete this request. Please try again or contact your administrator.'
    : 'The request could not be completed. Please check the record details.' };
}

function sendApiError(res, error, fallbackStatus) {
  const { status, ...body } = describeError(error, fallbackStatus);
  return res.status(status).json(body);
}
module.exports = { describeError, sendApiError };
