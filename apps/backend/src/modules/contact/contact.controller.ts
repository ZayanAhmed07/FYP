import { Request, Response } from 'express';
import { contactService } from './contact.service';
import { catchAsync } from '../../utils/catchAsync';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export const submitContactForm = catchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, email, message, userId } = req.body;

  if (!firstName || !lastName || !email || !message) {
    throw new ApiError(400, 'All fields are required');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  const ipAddress = req.ip || req.connection.remoteAddress || undefined;

  const contact = await contactService.createContact({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    ...(ipAddress && { ipAddress }),
    ...(userId && { userId }),
  });

  res.status(201).json(
    ApiResponse.success(201, 'Contact form submitted successfully', contact)
  );
});

export const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const result = await contactService.getAllContacts(page, limit, status);

  res.status(200).json(
    ApiResponse.success(200, 'Contacts retrieved successfully', result)
  );
});

export const getContactById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, 'Contact ID is required');
  }
  
  const contact = await contactService.getContactById(id);
  
  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  res.status(200).json(
    ApiResponse.success(200, 'Contact retrieved successfully', contact)
  );
});

export const updateContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;
  const adminId = req.user?.id;

  if (!id) {
    throw new ApiError(400, 'Contact ID is required');
  }

  const allowedStatuses = ['pending', 'reviewed', 'responded'];
  if (status && !allowedStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const contact = await contactService.updateContact(
    id,
    { status, adminResponse },
    adminId
  );

  res.status(200).json(
    ApiResponse.success(200, 'Contact updated successfully', contact)
  );
});

export const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, 'Contact ID is required');
  }
  
  const deleted = await contactService.deleteContact(id);
  
  if (!deleted) {
    throw new ApiError(404, 'Contact not found');
  }

  res.status(200).json(
    ApiResponse.success(200, 'Contact deleted successfully', null)
  );
});

export const getContactStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await contactService.getContactStats();

  res.status(200).json(
    ApiResponse.success(200, 'Contact statistics retrieved successfully', stats)
  );
});