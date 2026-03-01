import request from 'supertest';
import app from '../../app';

describe('Functional Testing - Authentication and Role-Based Access', () => {
  describe('Login with Different Roles', () => {
    it('should login as buyer and access buyer dashboard', async () => {
      // Register as buyer
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Buyer User',
          email: 'buyer@test.com',
          password: '123456',
          accountType: 'buyer',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.user.accountType).toBe('buyer');

      // Login as buyer
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: '123456',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.accountType).toBe('buyer');
      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('should login as consultant and access consultant dashboard', async () => {
      // Register as consultant
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Consultant User',
          email: 'consultant@test.com',
          password: '123456',
          accountType: 'consultant',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.user.accountType).toBe('consultant');

      // Login as consultant
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'consultant@test.com',
          password: '123456',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.accountType).toBe('consultant');
      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('should return correct user profile for authenticated user', async () => {
      // Register and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'user@test.com',
          password: '123456',
          accountType: 'buyer',
        });

      const token = registerResponse.body.data.token;

      // Get user profile
      const profileResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.name).toBe('Test User');
      expect(profileResponse.body.data.email).toBe('user@test.com');
    });
  });
});




