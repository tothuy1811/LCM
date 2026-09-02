export const SESSION_COOKIE_NAME = "session";

export const SESSION_COOKIE_MAX_AGE_SECONDS = Number(
  process.env.SESSION_COOKIE_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 5
);
