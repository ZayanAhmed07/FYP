import path from 'path';

import { config } from 'dotenv';
import Joi from 'joi';

const envFile = `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`;

config({ path: path.resolve(process.cwd(), envFile) });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  PASSWORD_RESET_EXPIRES_IN: Joi.string().default('1h'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),
  HUGGINGFACE_API_KEY: Joi.string().optional().allow(''),
  GROQ_API_KEY: Joi.string().optional().allow(''),
  API_URL: Joi.string().uri().default('http://localhost:5000'),
})
  .unknown()
  .required();

const { value, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const env = {
  nodeEnv: value.NODE_ENV as string,
  isDev: value.NODE_ENV === 'development',
  port: Number(value.PORT),
  mongodbUri: value.MONGODB_URI as string,
  jwtSecret: value.JWT_SECRET as string,
  jwtExpiresIn: value.JWT_EXPIRES_IN as string,
  frontendUrl: value.FRONTEND_URL as string,
  passwordResetExpiresIn: value.PASSWORD_RESET_EXPIRES_IN as string,
  logLevel: value.LOG_LEVEL as string,
  smtpHost: value.SMTP_HOST as string,
  smtpPort: Number(value.SMTP_PORT),
  smtpUser: value.SMTP_USER as string,
  smtpPass: value.SMTP_PASS as string,
  adminEmail: value.ADMIN_EMAIL as string,
  googleClientId: value.GOOGLE_CLIENT_ID as string,
  googleClientSecret: value.GOOGLE_CLIENT_SECRET as string,
  HUGGINGFACE_API_KEY: value.HUGGINGFACE_API_KEY as string,
  GROQ_API_KEY: value.GROQ_API_KEY as string,
  apiUrl: value.API_URL as string,
};

export default env;

