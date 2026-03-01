import { celebrate, Joi, Segments } from 'celebrate';

export const createPaymentValidator = celebrate({
  [Segments.BODY]: Joi.object({
    orderId: Joi.string().allow('').optional(),
    proposalId: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('easypaisa', 'jazzcash', 'card').required(),
    paymentDetails: Joi.object({
      // For EasyPaisa/JazzCash - accept any mobile number
      mobileNumber: Joi.string().min(10).max(15).optional(),
      // For Card - accept any card number
      cardNumber: Joi.string().min(13).max(19).optional(),
      expiryDate: Joi.string().min(4).max(7).optional(),
      cvv: Joi.string().min(3).max(4).optional(),
      cardHolderName: Joi.string().min(3).optional()
    }).required(),
    otp: Joi.string().optional()
  })
});

export const verifyPaymentValidator = celebrate({
  [Segments.BODY]: Joi.object({
    paymentId: Joi.string().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required()
  })
});
