import { Joi, Segments, celebrate } from 'celebrate';

export const loginValidator = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
});

export const registerValidator = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(3).max(120).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    accountType: Joi.string().valid('buyer', 'consultant').required(),
  }),
});


