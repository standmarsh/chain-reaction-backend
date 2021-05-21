import JWT from 'jsonwebtoken';
import createError from 'http-errors';

import logger from '../../utils/logger';

const client = require('../redis/redis_init');

export const signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: '30s',
      issuer: 'Chain Reaction Online',
      audience: userId,
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        logger.warn(err.message);
        reject(createError.InternalServerError());
        return;
      }
      resolve(token);
    });
  });
};

export const verifyAccessToken = (req, res, next) => {
  if (!req.headers.authorization) return next(createError.Unauthorized());

  const authHeader = req.headers.authorization;
  const bearerToken = authHeader.split(' ');
  const token = bearerToken[1];

  JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      const message =
        err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
      return next(createError.Unauthorized(message));
    }
    req.payload = payload;
    next();
  });
};

export const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: '1y',
      issuer: 'Chain Reaction Online',
      audience: userId,
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        logger.error(err.message);
        reject(createError.InternalServerError());
      }

      client.SET(userId, token, 'EX', 365 * 24 * 60 * 60, (error, reply) => {
        if (error) {
          logger.error(error.message);
          reject(createError.InternalServerError());
          return;
        }
        resolve(token);
      });
    });
  });
};

export const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        const userId = payload.aud;
        client.GET(userId, (error, result) => {
          if (error) {
            logger.error(error.message);
            reject(createError.InternalServerError());
            return;
          }
          if (refreshToken === result) return resolve(userId);
          reject(createError.Unauthorized());
        });
      }
    );
  });
};