import request from 'supertest';
import app from '../../app';
import { User } from '../../modules/user/user.model';
import {
  assertSuccessResponse,
  assertErrorResponse,
  assertValidationError,
  assertHasFields,
  assertValidEmail,
  assertValidObjectId,
  assertNoSensitiveData,
  assertTimestamps,
  assertRecordExists,
} from '../utils/assertions.helpers';

describe('Unit Testing - Authentication', () => {
  const testEmails: string[] = [];

  // Clean up test users after all tests
  afterAll(async () => {
    await User.deleteMany({ email: { $in: testEmails } });
  });

  describe('User Registration', () => {
    it('should register a new user with valid data and return JWT token', async () => {
      const userData = {
        name: 'Test Consultant',
        email: `consultant-${Date.now()}@gmail.com`,
        password: '123456',
        accountType: 'consultant',
      };
      testEmails.push(userData.email);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert response structure
      assertSuccessResponse(response, 201);
      expect(response.body).toHaveProperty('message');
      
      // Assert user data
      assertHasFields(response.body.data, ['user', 'token']);
      assertHasFields(response.body.data.user, ['_id', 'name', 'email', 'accountType']);
      
      // Verify field values
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.accountType).toBe(userData.accountType);
      
      // Assert security - no sensitive data
      assertNoSensitiveData(response.body.data.user);
      
      // Assert valid IDs and formats
      assertValidObjectId(response.body.data.user._id);
      assertValidEmail(response.body.data.user.email);
      
      // Assert token is present
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.length).toBeGreaterThan(20);
      
      // Verify user was created in database
      const dbUser = await assertRecordExists(User, { email: userData.email });
      expect(dbUser.name).toBe(userData.name);
      expect(dbUser.accountType).toBe(userData.accountType);
      assertTimestamps(dbUser);
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'consultant.gmail.com', // Missing @
          password: '123456',
          accountType: 'consultant',
        });

      assertValidationError(response);
      expect(response.body.message || response.body.error).toMatch(/email/i);
    });

    it('should reject registration with password shorter than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: `short-pw-${Date.now()}@gmail.com`,
          password: '12345', // Too short
          accountType: 'buyer',
        });

      assertValidationError(response);
      expect(response.body.message || response.body.error).toMatch(/password/i);
    });

    it('should accept registration with valid password length (6+ characters)', async () => {
      const email = `validuser-${Date.now()}@gmail.com`;
      testEmails.push(email);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email,
          password: '123456',
          accountType: 'buyer',
        });

      assertSuccessResponse(response, 201);
      expect(response.body.data.user).toBeDefined();
      
      // Verify in database
      await assertRecordExists(User, { email });
    });

    it('should reject registration without name field', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `no-name-${Date.now()}@gmail.com`,
          password: '123456',
          accountType: 'buyer',
        });

      assertValidationError(response, 'name');
    });

    it('should accept valid account type and store it correctly', async () => {
      const email = `buyer-${Date.now()}@test.com`;
      testEmails.push(email);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Buyer User',
          email,
          password: '123456',
          accountType: 'buyer',
        });

      assertSuccessResponse(response, 201);
      expect(response.body.data.user.accountType).toBe('buyer');
      
      // Verify in database
      const dbUser = await assertRecordExists(User, { email });
      expect(dbUser.accountType).toBe('buyer');
    });

    it('should reject registration with duplicate email', async () => {
      const email = `duplicate-${Date.now()}@test.com`;
      testEmails.push(email);

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email,
          password: '123456',
          accountType: 'buyer',
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email, // Same email
          password: '123456',
          accountType: 'consultant',
        });

      assertErrorResponse(response, 409);
      expect(response.body.message || response.body.error).toMatch(/email|already|exists/i);
    });
  });


  describe('User Login', () => {
    let testUser: { email: string; password: string };

    beforeEach(async () => {
      // Create a fresh test user for each login test
      const email = `login-test-${Date.now()}@test.com`;
      const password = '123456';
      testEmails.push(email);

      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test User',
          email,
          password,
          accountType: 'buyer',
        });

      testUser = { email, password };
    });

    it('should login with valid credentials and return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Assert response structure
      assertSuccessResponse(response, 200);
      expect(response.body).toHaveProperty('message');
      
      // Assert data structure
      assertHasFields(response.body.data, ['user', 'token']);
      assertHasFields(response.body.data.user, ['_id', 'name', 'email', 'accountType']);
      
      // Assert user data matches
      expect(response.body.data.user.email).toBe(testUser.email);
      assertValidObjectId(response.body.data.user._id);
      
      // Assert token is valid
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.length).toBeGreaterThan(20);
      
      // Assert no sensitive data
      assertNoSensitiveData(response.body.data.user);
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer.test.com', // Missing @
          password: '123456',
        });

      assertValidationError(response);
      expect(response.body.message || response.body.error).toMatch(/email/i);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: '123456',
        });

      assertErrorResponse(response, 401, /invalid|credentials|email|password/i);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      assertErrorResponse(response, 401, /invalid|credentials|password/i);
    });

    it('should require email field for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: '123456',
        });

      assertValidationError(response, 'email');
    });

    it('should require password field for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        });

      assertValidationError(response, 'password');
    });

    it('should reject login with empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: '123456',
        });

      assertValidationError(response);
    });

    it('should reject login with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: '',
        });

      assertValidationError(response);
    });
  });
});



