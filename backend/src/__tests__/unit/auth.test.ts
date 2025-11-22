import request from 'supertest';
import app from '../../app';
import { User } from '../../modules/user/user.model';

describe('Unit Testing - Authentication', () => {
  describe('User Registration', () => {
    it('should validate email field for proper email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Consultant',
          email: 'consultant@gmail.com',
          password: '123456',
          accountType: 'consultant',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('consultant@gmail.com');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'consultant.gmail.com',
          password: '123456',
          accountType: 'consultant',
        });

      expect(response.status).toBe(400);
    });

    it('should enforce minimum password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@gmail.com',
          password: '12345',
          accountType: 'buyer',
        });

      expect(response.status).toBe(400);
    });

    it('should accept valid password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'validuser@gmail.com',
          password: '123456',
          accountType: 'buyer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should require name field', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@gmail.com',
          password: '123456',
          accountType: 'buyer',
        });

      expect(response.status).toBe(400);
    });

    it('should accept valid account type selection', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Buyer User',
          email: 'buyer@test.com',
          password: '123456',
          accountType: 'buyer',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.accountType).toBe('buyer');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'buyer@test.com',
          password: '123456',
          accountType: 'buyer',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer.test.com',
          password: '123456',
        });

      expect(response.status).toBe(400);
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'fake@test.com',
          password: '123456',
        });

      expect(response.status).toBe(401);
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should require email field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: '123456',
        });

      expect(response.status).toBe(400);
    });

    it('should require password field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
        });

      expect(response.status).toBe(400);
    });
  });
});



