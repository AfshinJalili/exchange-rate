import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('CurrencyRatesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/currency-rates/currencies (GET)', () => {
    it('should return list of currencies', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/currencies')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('currencies');
          expect(typeof res.body.currencies).toBe('object');
          // Should contain some common currencies
          expect(res.body.currencies).toHaveProperty('USD');
          expect(res.body.currencies).toHaveProperty('EUR');
        });
    });

    it('should return cached currencies on subsequent requests', async () => {
      // First request
      const firstResponse = await request(app.getHttpServer())
        .get('/currency-rates/currencies')
        .expect(200);

      // Second request should be faster (cached)
      const secondResponse = await request(app.getHttpServer())
        .get('/currency-rates/currencies')
        .expect(200);

      expect(firstResponse.body).toEqual(secondResponse.body);
    });
  });

  describe('/currency-rates/rate (GET)', () => {
    it('should return exchange rate for valid currencies', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=USD&to=EUR')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rate');
          expect(typeof res.body.rate).toBe('number');
          expect(res.body.rate).toBeGreaterThan(0);
        });
    });

    it('should return exchange rate for EUR to USD', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=EUR&to=USD')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rate');
          expect(typeof res.body.rate).toBe('number');
          expect(res.body.rate).toBeGreaterThan(0);
        });
    });

    it('should return exchange rate for GBP to JPY', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=GBP&to=JPY')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rate');
          expect(typeof res.body.rate).toBe('number');
          expect(res.body.rate).toBeGreaterThan(0);
        });
    });

    it('should return cached rate on subsequent requests', async () => {
      // First request
      const firstResponse = await request(app.getHttpServer())
        .get('/currency-rates/rate?from=USD&to=EUR')
        .expect(200);

      // Second request should be faster (cached)
      const secondResponse = await request(app.getHttpServer())
        .get('/currency-rates/rate?from=USD&to=EUR')
        .expect(200);

      expect(firstResponse.body).toEqual(secondResponse.body);
    });

    it('should handle case-insensitive currency codes', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=usd&to=eur')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rate');
          expect(typeof res.body.rate).toBe('number');
        });
    });
  });

  describe('Error handling', () => {
    it('should return 400 for missing from parameter', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?to=EUR')
        .expect(400);
    });

    it('should return 400 for missing to parameter', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=USD')
        .expect(400);
    });

    it('should return 400 for invalid currency codes', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=INVALID&to=EUR')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid currency code');
        });
    });

    it('should return 400 for both invalid currency codes', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=INVALID1&to=INVALID2')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid currency code');
        });
    });

    it('should return 400 for empty currency codes', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=&to=EUR')
        .expect(400);
    });
  });

  describe('API performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/currency-rates/rate?from=USD&to=EUR')
            .expect(200),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.body).toHaveProperty('rate');
        expect(typeof response.body.rate).toBe('number');
      });
    });

    it('should return consistent results for same currency pair', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/currency-rates/rate?from=USD&to=EUR')
            .expect(200),
        );

      const responses = await Promise.all(requests);
      const rates = responses.map((res) => res.body.rate);

      // All rates should be the same (within reasonable tolerance for API updates)
      const firstRate = rates[0];
      rates.forEach((rate) => {
        expect(rate).toBeCloseTo(firstRate, 4);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle same currency conversion', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=USD&to=USD')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rate');
          expect(res.body.rate).toBe(1);
        });
    });

    it('should handle special characters in query parameters', () => {
      return request(app.getHttpServer())
        .get('/currency-rates/rate?from=USD&to=EUR&extra=param')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rate');
          expect(typeof res.body.rate).toBe('number');
        });
    });
  });
});
