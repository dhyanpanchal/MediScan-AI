const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

// Identity is resolved securely against Google (or dev simulator when in non-production).
// In production, unverified tokens or email/name supplied by client are strictly rejected.
async function verifyGoogleIdentity(body, client = new OAuth2Client(), fetcher = fetch) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) throw Object.assign(new Error('Google sign-in is not configured.'), { status: 503 });

  // Handle local development simulation tokens safely (only when not in production)
  if (
    process.env.NODE_ENV !== 'production' &&
    typeof body.oauthToken === 'string' &&
    body.oauthToken.startsWith('google_demo_token_')
  ) {
    const demoEmail = (typeof body.email === 'string' && body.email.includes('@'))
      ? body.email.trim().toLowerCase()
      : 'demo.user@mediscan.local';
    const demoName = (typeof body.name === 'string' && body.name.trim())
      ? body.name.trim()
      : demoEmail.split('@')[0];
    const demoSub = 'demo_google_' + crypto.createHash('sha256').update(demoEmail).digest('hex').slice(0, 16);
    return { email: demoEmail, name: demoName, sub: demoSub };
  }

  try {
    let claims;
    if (typeof body.credential === 'string' && body.credential) {
      const ticket = await client.verifyIdToken({ idToken: body.credential, audience });
      claims = ticket.getPayload();
    } else {
      if (typeof body.oauthToken !== 'string' || !body.oauthToken) throw new Error('Missing token');
      const info = await client.getTokenInfo(body.oauthToken);

      // Check audience: in GIS access tokens, aud or azp matches client ID
      const isAudienceValid = info.aud === audience || info.azp === audience;
      if (!isAudienceValid || !Number.isFinite(info.expiry_date) || info.expiry_date <= Date.now()) {
        throw new Error('Invalid token audience or expiry');
      }

      const response = await fetcher('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${body.oauthToken}` },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error('Identity lookup failed');
      claims = await response.json();

      const infoSub = info.sub || info.user_id;
      if (infoSub && claims.sub && String(infoSub) !== String(claims.sub)) {
        throw new Error('Identity mismatch');
      }
    }

    const isEmailVerified =
      claims?.email_verified === true ||
      claims?.email_verified === 'true' ||
      claims?.verified_email === true ||
      claims?.verified_email === 'true';

    if (!claims?.sub || !claims.email || !isEmailVerified) {
      throw new Error('Unverified identity');
    }

    return {
      email: claims.email.trim().toLowerCase(),
      name: claims.name || claims.email.split('@')[0],
      sub: claims.sub
    };
  } catch (err) {
    console.warn(`[Google Identity] Verification rejected: ${err.message}`);
    throw Object.assign(new Error('Invalid or expired Google credential.'), { status: 401 });
  }
}

module.exports = { verifyGoogleIdentity };
