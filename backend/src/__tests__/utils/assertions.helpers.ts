/**
 * Test Utilities - Custom Assertions
 * Reusable assertion helpers for common test patterns
 */

import { Response } from 'supertest';

/**
 * Assert successful response with data
 */
export const assertSuccessResponse = (
  response: Response,
  expectedStatus: number = 200
): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toBeDefined();
};

/**
 * Assert error response with message
 */
export const assertErrorResponse = (
  response: Response,
  expectedStatus: number,
  expectedMessagePattern?: string | RegExp
): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
  
  if (expectedMessagePattern) {
    if (typeof expectedMessagePattern === 'string') {
      expect(response.body.message).toContain(expectedMessagePattern);
    } else {
      expect(response.body.message).toMatch(expectedMessagePattern);
    }
  }
};

/**
 * Assert unauthorized response
 */
export const assertUnauthorized = (response: Response): void => {
  assertErrorResponse(response, 401, /unauthorized|authentication/i);
};

/**
 * Assert forbidden response
 */
export const assertForbidden = (response: Response): void => {
  assertErrorResponse(response, 403, /forbidden|permission/i);
};

/**
 * Assert not found response
 */
export const assertNotFound = (response: Response, resourceName?: string): void => {
  assertErrorResponse(response, 404, resourceName ? new RegExp(resourceName, 'i') : /not found/i);
};

/**
 * Assert validation error response
 */
export const assertValidationError = (
  response: Response,
  fieldName?: string
): void => {
  expect(response.status).toBe(400);
  
  // Handle different error response formats
  const hasSuccess = response.body.hasOwnProperty('success');
  if (hasSuccess) {
    expect(response.body.success).toBe(false);
  }
  
  if (fieldName) {
    // Check in message, error, or validation.body.message
    const errorMessage = response.body.message || response.body.error || '';
    const validationMessage = response.body.validation?.body?.message || '';
    const combinedMessage = `${errorMessage} ${validationMessage}`;
    expect(combinedMessage).toMatch(new RegExp(fieldName, 'i'));
  }
};

/**
 * Assert object has required fields
 */
export const assertHasFields = (
  obj: any,
  fields: string[]
): void => {
  fields.forEach(field => {
    // Handle both '_id' and 'id' formats for MongoDB IDs
    if (field === '_id' && !obj._id && obj.id) {
      expect(obj).toHaveProperty('id');
      expect(obj.id).toBeDefined();
    } else {
      expect(obj).toHaveProperty(field);
      expect(obj[field]).toBeDefined();
    }
  });
};

/**
 * Assert pagination response structure
 */
export const assertPaginationResponse = (
  response: Response,
  expectedStatus: number = 200
): void => {
  assertSuccessResponse(response, expectedStatus);
  expect(response.body.data).toHaveProperty('docs');
  expect(response.body.data).toHaveProperty('totalDocs');
  expect(response.body.data).toHaveProperty('limit');
  expect(response.body.data).toHaveProperty('page');
  expect(response.body.data).toHaveProperty('totalPages');
  expect(response.body.data).toHaveProperty('hasNextPage');
  expect(response.body.data).toHaveProperty('hasPrevPage');
  expect(Array.isArray(response.body.data.docs)).toBe(true);
};

/**
 * Assert database record exists
 */
export const assertRecordExists = async (
  Model: any,
  query: any
): Promise<any> => {
  const record = await Model.findOne(query);
  expect(record).not.toBeNull();
  expect(record).toBeDefined();
  return record;
};

/**
 * Assert database record does not exist
 */
export const assertRecordNotExists = async (
  Model: any,
  query: any
): Promise<void> => {
  const record = await Model.findOne(query);
  expect(record).toBeNull();
};

/**
 * Assert array contains object with properties
 */
export const assertArrayContainsObject = (
  array: any[],
  properties: Record<string, any>
): void => {
  expect(array).toBeDefined();
  expect(Array.isArray(array)).toBe(true);
  
  const found = array.some(item => {
    return Object.keys(properties).every(key => {
      return item[key] === properties[key];
    });
  });
  
  expect(found).toBe(true);
};

/**
 * Assert timestamp fields
 */
export const assertTimestamps = (obj: any): void => {
  expect(obj).toHaveProperty('createdAt');
  expect(obj).toHaveProperty('updatedAt');
  expect(new Date(obj.createdAt)).toBeInstanceOf(Date);
  expect(new Date(obj.updatedAt)).toBeInstanceOf(Date);
};

/**
 * Assert MongoDB ObjectId format
 */
export const assertValidObjectId = (id: string): void => {
  expect(id).toBeDefined();
  expect(typeof id).toBe('string');
  expect(id).toMatch(/^[0-9a-fA-F]{24}$/);
};

/**
 * Assert email format
 */
export const assertValidEmail = (email: string): void => {
  expect(email).toBeDefined();
  expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

/**
 * Assert no sensitive data in response
 */
export const assertNoSensitiveData = (obj: any): void => {
  expect(obj).not.toHaveProperty('password');
  expect(obj).not.toHaveProperty('passwordHash');
  expect(obj).not.toHaveProperty('salt');
  expect(obj).not.toHaveProperty('__v');
};

/**
 * Assert rate limit response
 */
export const assertRateLimited = (response: Response): void => {
  expect(response.status).toBe(429);
  expect(response.body.message || response.body.error).toMatch(/rate limit|too many requests/i);
};

/**
 * Wait for a condition to be true (for async operations)
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
};

export default {
  assertSuccessResponse,
  assertErrorResponse,
  assertUnauthorized,
  assertForbidden,
  assertNotFound,
  assertValidationError,
  assertHasFields,
  assertPaginationResponse,
  assertRecordExists,
  assertRecordNotExists,
  assertArrayContainsObject,
  assertTimestamps,
  assertValidObjectId,
  assertValidEmail,
  assertNoSensitiveData,
  assertRateLimited,
  waitFor,
};
