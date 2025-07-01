import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Authentication Flow', () => {
  let app: INestApplication;
  let token: string;
  const testUser = {
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('should access public mock endpoint successfully', () => {
    return request(app.getHttpServer())
      .post('/api/mock')
      .send({ name: 'test' })
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('hi test');
      });
  });

  it('should fail to access protected endpoint without token', () => {
    return request(app.getHttpServer())
      .get('/api/mock/auth')
      .expect(401);
  });

  it('should register a new user', () => {
    return request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(testUser)
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
      });
  });

  it('should sign in with registered user', () => {
    return request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        token = res.body.token; // Save token for next test
      });
  });

  it('should access protected endpoint with valid token', () => {
    return request(app.getHttpServer())
      .get('/api/mock/auth')
      .set('token', token)
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('username', testUser.username);
        expect(res.body.user).toHaveProperty('email', testUser.email);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
