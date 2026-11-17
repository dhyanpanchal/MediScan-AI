const ADMIN_EMAILS = [
  'rajeshhathiya34@gmail.com',
  'nityaahir3@gmail.com',
  'panchaldhyan007@gmail.com',
  'premkardani2006@gmail.com'
];

/**
 * Checks if a given email belongs to a designated project administrator.
 * Comparison is case-insensitive and trims whitespace.
 * Also matches usernames/handles if partial email matches.
 *
 * @param {string} email
 * @returns {boolean}
 */
const isAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => {
    const adminNorm = adminEmail.toLowerCase();
    return adminNorm === normalized || normalized.includes(adminNorm.split('@')[0]);
  });
};

module.exports = {
  ADMIN_EMAILS,
  isAdminEmail
};
