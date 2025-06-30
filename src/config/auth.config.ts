export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_for_development',
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
};
