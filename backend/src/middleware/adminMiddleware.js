const { isAdminEmail } = require('../utils/adminList');

const adminOnly = (req, res, next) => {
  if (req.user?.isAdmin === true || isAdminEmail(req.user?.email)) {
    if (req.user && !req.user.isAdmin) {
      req.user.isAdmin = true;
    }
    return next();
  }
  
  return res.status(403).json({
    success: false,
    error: 'Access denied: Administrative privileges required'
  });
};

module.exports = { adminOnly };
