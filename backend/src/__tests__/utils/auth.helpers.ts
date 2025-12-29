/**
 * Test Utilities - Auth Helpers
 * Simplified user creation and authentication for tests
 */

import request from 'supertest';
import app from '../../app';
import { User } from '../../modules/user/user.model';
import { Consultant } from '../../models/consultant.model';
import jwt from 'jsonwebtoken';

export interface TestUser {
  _id: string;
  name: string;
  email: string;
  accountType: 'buyer' | 'consultant' | 'admin';
  token: string;
  password?: string;
}

/**
 * Create a test user with authentication token
 */
export const createTestUser = async (
  accountType: 'buyer' | 'consultant' | 'admin' = 'buyer',
  customData?: Partial<any>
): Promise<TestUser> => {
  const timestamp = Date.now();
  const userData = {
    name: customData?.name || `Test ${accountType} ${timestamp}`,
    email: customData?.email || `test-${accountType}-${timestamp}@test.com`,
    password: customData?.password || 'password123',
    accountType,
    ...customData,
  };

  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  if (response.status !== 201) {
    throw new Error(`Failed to create test user: ${JSON.stringify(response.body)}`);
  }

  return {
    _id: response.body.data.user._id,
    name: response.body.data.user.name,
    email: response.body.data.user.email,
    accountType: response.body.data.user.accountType,
    token: response.body.data.token,
    password: userData.password,
  };
};

/**
 * Login an existing user
 */
export const loginTestUser = async (
  email: string,
  password: string
): Promise<TestUser> => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Failed to login user: ${JSON.stringify(response.body)}`);
  }

  return {
    _id: response.body.data.user._id,
    name: response.body.data.user.name,
    email: response.body.data.user.email,
    accountType: response.body.data.user.accountType,
    token: response.body.data.token,
  };
};

/**
 * Create a consultant profile for a user
 */
export const createConsultantProfile = async (
  userId: string,
  token: string,
  profileData?: Partial<any>
): Promise<any> => {
  const consultantData = {
    userId,
    title: profileData?.title || 'Senior Consultant',
    bio: profileData?.bio || 'Experienced professional with expertise in various domains',
    specialization: profileData?.specialization || ['Business', 'Technology'],
    skills: profileData?.skills || ['Strategy', 'Analysis', 'Implementation'],
    hourlyRate: profileData?.hourlyRate || 50,
    experience: profileData?.experience || '5+ years',
    ...profileData,
  };

  const response = await request(app)
    .post('/api/consultants')
    .set('Authorization', `Bearer ${token}`)
    .send(consultantData);

  if (response.status !== 201) {
    throw new Error(`Failed to create consultant profile: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Generate a JWT token for a user (bypass registration/login)
 */
export const generateToken = (userId: string): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'test-secret-key-for-testing-only',
    { expiresIn: String(expiresIn) }
  );
};

/**
 * Create multiple test users at once
 */
export const createTestUsers = async (count: number, accountType: 'buyer' | 'consultant' = 'buyer'): Promise<TestUser[]> => {
  const users: TestUser[] = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(accountType, { name: `Test User ${i + 1}` });
    users.push(user);
  }
  return users;
};

/**
 * Create a complete consultant (user + profile)
 */
export const createCompleteConsultant = async (customData?: Partial<any>): Promise<{
  user: TestUser;
  consultant: any;
}> => {
  const user = await createTestUser('consultant', customData);
  const consultant = await createConsultantProfile(user._id, user.token, customData);
  
  return { user, consultant };
};

/**
 * Get authorization header string
 */
export const getAuthHeader = (token: string): string => {
  return `Bearer ${token}`;
};

/**
 * Clean up test users (use with caution)
 */
export const cleanupTestUsers = async (emails: string[]): Promise<void> => {
  await User.deleteMany({ email: { $in: emails } });
  const userIds = await User.find({ email: { $in: emails } }).select('_id');
  await Consultant.deleteMany({ userId: { $in: userIds.map(u => u._id) } });
};

export default {
  createTestUser,
  loginTestUser,
  createConsultantProfile,
  generateToken,
  createTestUsers,
  createCompleteConsultant,
  getAuthHeader,
  cleanupTestUsers,
};
