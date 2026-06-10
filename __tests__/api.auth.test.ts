import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { NextResponse } from 'next/server';

// Mock Dependencies
jest.mock('@neondatabase/serverless', () => {
  const sqlMock = jest.fn();
  return { neon: jest.fn(() => sqlMock) };
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn()
}));

jest.mock('jose', () => {
  return {
    SignJWT: jest.fn().mockImplementation(() => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('mock_jwt_token')
    }))
  };
});

describe('Auth API Routes', () => {
  let mockSql: jest.Mock;

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://fake-db';
    // Get the mocked neon function and its returned mockSql
    const { neon } = require('@neondatabase/serverless');
    mockSql = jest.fn();
    (neon as jest.Mock).mockReturnValue(mockSql);
    jest.clearAllMocks();
  });

  describe('Register POST', () => {
    it('returns 400 if email or password missing', async () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }) // missing password
      });
      const res = await registerPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Email and password are required');
    });

    it('returns 409 if user already exists', async () => {
      mockSql.mockResolvedValueOnce([{ id: 1 }]); // User exists
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'pass' })
      });
      const res = await registerPOST(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe('User already exists');
    });

    it('registers a new user and returns 201', async () => {
      mockSql.mockResolvedValueOnce([]); // No existing user
      mockSql.mockResolvedValueOnce([{ id: 2, email: 'new@test.com' }]); // Insert return
      
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@test.com', password: 'pass' })
      });
      const res = await registerPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.id).toBe(2);
    });
  });

  describe('Login POST', () => {
    it('returns 401 on invalid credentials (not found)', async () => {
      mockSql.mockResolvedValueOnce([]); // No user found
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'bad@test.com', password: 'bad' })
      });
      const res = await loginPOST(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 on wrong password', async () => {
      mockSql.mockResolvedValueOnce([{ id: 1, email: 'test@test.com', password_hash: 'hash' }]);
      const bcrypt = require('bcryptjs');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false); // Password mismatch

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
      });
      const res = await loginPOST(req);
      expect(res.status).toBe(401);
    });

    it('logs in and returns jwt cookie', async () => {
      mockSql.mockResolvedValueOnce([{ id: 1, email: 'test@test.com', password_hash: 'hash' }]);
      const bcrypt = require('bcryptjs');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true); // Password match

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'pass' })
      });
      
      const res = await loginPOST(req);
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.id).toBe(1);

      // Verify cookie was set
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('auth_token=mock_jwt_token');
    });
  });
});
