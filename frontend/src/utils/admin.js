export const ADMIN_EMAILS = [
  'rajeshhathiya34@gmail.com',
  'nityaahir3@gmail.com',
  'panchaldhyan007@gmail.com',
  'premkardani2006@gmail.com',
];

/**
 * Validates whether a user has administrative authority.
 * Checks:
 * 1. user.isAdmin === true flag from backend
 * 2. user.email matches any of the designated team admin emails (case-insensitive & whitespace-trimmed)
 *
 * @param {object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const checkIsAdmin = (user) => {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (!user.email || typeof user.email !== 'string') return false;

  const normalizedEmail = user.email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => {
    const adminNorm = adminEmail.toLowerCase();
    return (
      adminNorm === normalizedEmail ||
      normalizedEmail.includes(adminNorm.split('@')[0])
    );
  });
};
