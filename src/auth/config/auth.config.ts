import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    audience: process.env.JWT_TOKEN_AUDIENCE,
    issuer: process.env.JWT_TOKEN_ISSUER,
  },

  //   bcrypt: {
  //     saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  //   },
  //   oauth: {
  //     google: {
  //       clientId: process.env.GOOGLE_CLIENT_ID,
  //       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  //       callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  //     },
  //     github: {
  //       clientId: process.env.GITHUB_CLIENT_ID,
  //       clientSecret: process.env.GITHUB_CLIENT_SECRET,
  //       callbackUrl: process.env.GITHUB_CALLBACK_URL,
  //     },
  //   },
  //   session: {
  //     secret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
  //     maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours in ms
  //   },
  //   rateLimit: {
  //     ttl: parseInt(process.env.AUTH_RATE_LIMIT_TTL || '60', 10), // 60 seconds
  //     limit: parseInt(process.env.AUTH_RATE_LIMIT || '10', 10), // 10 requests
  //   },
}));
