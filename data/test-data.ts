


export function getUser() {
  const env = process.env.ENV || 'dev';
  const config = require(`../config/${env}`).default;

  return config.user;
}
