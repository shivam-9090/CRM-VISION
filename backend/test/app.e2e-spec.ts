import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('CRM API (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
    });
  });

  describe('Authentication Flow', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@crm.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      accessToken = response.body.token;
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@crm.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should get user profile with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@crm.com',
          password: 'password123',
        })
        .expect(201);

      const token = loginResponse.body.token;

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'admin@crm.com');
          expect(res.body).toHaveProperty('role');
        });
    });

    it('should reject requests without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('Companies CRUD', () => {
    let companyId: string;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@crm.com',
          password: 'password123',
        })
        .expect(201);
      accessToken = loginResponse.body.token;
    });

    it('should get user company profile', () => {
      return request(app.getHttpServer())
        .get('/api/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
        });
    });

    it('should get company profile endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/companies/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      companyId = response.body.id;
    });
  });

  describe('Password Reset Flow', () => {
    it('should accept forgot password request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'admin@crm.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle non-existent email gracefully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Deals CRUD', () => {
    let dealId: string;

    it('should get deals list', () => {
      return request(app.getHttpServer())
        .get('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should create a new deal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Deal',
          stage: 'PROSPECTING',
          value: '25000.00',
          priority: 'HIGH',
          leadSource: 'WEBSITE',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('E2E Test Deal');
      expect(response.body.stage).toBe('PROSPECTING');
      expect(response.body.value).toBe('25000');
      dealId = response.body.id;
    });

    it('should update a deal', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/deals/${dealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated E2E Test Deal',
          stage: 'QUALIFIED',
          value: '30000.00',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated E2E Test Deal');
      expect(response.body.stage).toBe('QUALIFIED');
      expect(response.body.value).toBe('30000');
    });

    it('should get a specific deal', () => {
      return request(app.getHttpServer())
        .get(`/api/deals/${dealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', dealId);
          expect(res.body).toHaveProperty('title', 'Updated E2E Test Deal');
        });
    });

    it('should delete a deal', () => {
      return request(app.getHttpServer())
        .delete(`/api/deals/${dealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Contacts CRUD', () => {
    let contactId: string;

    it('should get contacts list', () => {
      return request(app.getHttpServer())
        .get('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should create a new contact', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@test.com',
          phone: '+1-555-TEST',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body.email).toBe('jane.doe@test.com');
      contactId = response.body.id;
    });

    it('should update a contact', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Janet',
          phone: '+1-555-UPDATED',
        })
        .expect(200);

      expect(response.body.firstName).toBe('Janet');
      expect(response.body.phone).toBe('+1-555-UPDATED');
    });

    it('should get a specific contact', () => {
      return request(app.getHttpServer())
        .get(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', contactId);
          expect(res.body).toHaveProperty('firstName', 'Janet');
        });
    });

    it('should delete a contact', () => {
      return request(app.getHttpServer())
        .delete(`/api/contacts/${contactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Activities CRUD', () => {
    let activityId: string;

    it('should get activities list', () => {
      return request(app.getHttpServer())
        .get('/api/activities')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should create a new activity', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Activity',
          type: 'CALL',
          status: 'SCHEDULED',
          scheduledDate: '2025-11-15T10:00:00.000Z',
          description: 'Test activity for E2E testing',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('E2E Test Activity');
      expect(response.body.type).toBe('CALL');
      expect(response.body.status).toBe('SCHEDULED');
      activityId = response.body.id;
    });

    it('should update an activity', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated E2E Test Activity',
          status: 'COMPLETED',
          description: 'Updated test activity',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated E2E Test Activity');
      expect(response.body.status).toBe('COMPLETED');
    });

    it('should get a specific activity', () => {
      return request(app.getHttpServer())
        .get(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', activityId);
          expect(res.body).toHaveProperty('title', 'Updated E2E Test Activity');
        });
    });

    it('should delete an activity', () => {
      return request(app.getHttpServer())
        .delete(`/api/activities/${activityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
