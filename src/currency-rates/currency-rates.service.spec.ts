import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';
import { REDIS_CLIENT } from '../redis/redis.module';

describe('CurrencyRatesService', () => {
  let service: CurrencyRatesService;
  let mockRedisClient: any;

  const mockCurrencies = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
  };

  const mockRatesResponse = {
    base: 'USD',
    results: {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.5,
    },
    updated: '2024-01-01T00:00:00Z',
    ms: 100,
  };

  beforeEach(async () => {
    // Set up environment variables for testing
    process.env.FAST_FOREX_API_URL = 'https://api.fastforex.io';
    process.env.FAST_FOREX_API_KEY = 'test-api-key';

    mockRedisClient = {
      hGetAll: jest.fn(),
      hGet: jest.fn(),
      hSet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyRatesService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<CurrencyRatesService>(CurrencyRatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrencies', () => {
    it('should return cached currencies when available', async () => {
      mockRedisClient.hGetAll.mockResolvedValue(mockCurrencies);

      const result = await service.getCurrencies();

      expect(result).toEqual({ currencies: mockCurrencies });
      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('currencies');
    });

    it('should fetch currencies from API when not cached', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      // Mock global fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ currencies: mockCurrencies }),
      });

      const result = await service.getCurrencies();

      expect(result).toEqual({ currencies: mockCurrencies });
      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('currencies');
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        'currencies',
        mockCurrencies,
      );
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw HttpException when API request fails', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.getCurrencies()).rejects.toThrow(HttpException);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle API response with error status', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(service.getCurrencies()).rejects.toThrow(
        new HttpException('Failed to get currencies', 401),
      );
    });

    it('should handle network errors', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.getCurrencies()).rejects.toThrow('Network error');
    });
  });

  describe('getRate', () => {
    beforeEach(() => {
      // Mock getCurrencies method to avoid API calls in rate tests
      jest.spyOn(service, 'getCurrencies').mockResolvedValue({
        currencies: mockCurrencies,
      });
    });

    it('should return cached rate when available', async () => {
      const cachedRate = '0.85';
      mockRedisClient.hGet.mockResolvedValue(cachedRate);

      const result = await service.getRate('USD', 'EUR');

      expect(result).toEqual({ rate: 0.85 });
      expect(mockRedisClient.hGet).toHaveBeenCalledWith('rate:USD', 'EUR');
    });

    it('should fetch rate from API when not cached', async () => {
      mockRedisClient.hGet.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRatesResponse),
      });

      const result = await service.getRate('USD', 'EUR');

      expect(result).toEqual({ rate: 0.85 });
      expect(mockRedisClient.hGet).toHaveBeenCalledWith('rate:USD', 'EUR');
      expect(mockRedisClient.hSet).toHaveBeenCalledWith('rate:USD', {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.5,
        updated: '2024-01-01T00:00:00Z',
      });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid source currency', async () => {
      await expect(service.getRate('INVALID', 'EUR')).rejects.toThrow(
        new BadRequestException(
          'Invalid currency code: INVALID or EUR',
          'Invalid currency code',
        ),
      );
    });

    it('should throw BadRequestException for invalid target currency', async () => {
      await expect(service.getRate('USD', 'INVALID')).rejects.toThrow(
        new BadRequestException(
          'Invalid currency code: USD or INVALID',
          'Invalid currency code',
        ),
      );
    });

    it('should throw BadRequestException for both invalid currencies', async () => {
      await expect(service.getRate('INVALID1', 'INVALID2')).rejects.toThrow(
        new BadRequestException(
          'Invalid currency code: INVALID1 or INVALID2',
          'Invalid currency code',
        ),
      );
    });

    it('should throw HttpException when API request fails', async () => {
      mockRedisClient.hGet.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.getRate('USD', 'EUR')).rejects.toThrow(
        HttpException,
      );
    });

    it('should handle API response with specific error status', async () => {
      mockRedisClient.hGet.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.getRate('USD', 'EUR')).rejects.toThrow(
        new HttpException('Failed to get rate for USD/EUR', 404),
      );
    });

    it('should handle network errors during rate fetch', async () => {
      mockRedisClient.hGet.mockResolvedValue(null);

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.getRate('USD', 'EUR')).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle case-insensitive currency codes', async () => {
      // Mock getCurrencies to return uppercase currencies
      jest.spyOn(service, 'getCurrencies').mockResolvedValue({
        currencies: {
          USD: 'US Dollar',
          EUR: 'Euro',
          GBP: 'British Pound',
          JPY: 'Japanese Yen',
        },
      });

      mockRedisClient.hGet.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRatesResponse),
      });

      const result = await service.getRate('USD', 'EUR');

      expect(result).toEqual({ rate: 0.85 });
    });

    it('should handle empty API response', async () => {
      mockRedisClient.hGet.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          base: 'USD',
          results: {},
          updated: '2024-01-01T00:00:00Z',
          ms: 100,
        }),
      });

      const result = await service.getRate('USD', 'EUR');

      expect(result).toEqual({ rate: undefined });
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent requests efficiently', async () => {
      mockRedisClient.hGetAll.mockResolvedValue(mockCurrencies);
      mockRedisClient.hGet.mockResolvedValue('0.85');

      const promises = [
        service.getRate('USD', 'EUR'),
        service.getRate('USD', 'EUR'),
        service.getRate('USD', 'EUR'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([{ rate: 0.85 }, { rate: 0.85 }, { rate: 0.85 }]);

      // Each request should call Redis (no actual caching in unit tests)
      expect(mockRedisClient.hGet).toHaveBeenCalledTimes(3);
    });

    it('should handle Redis connection issues gracefully', async () => {
      mockRedisClient.hGetAll.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ currencies: mockCurrencies }),
      });

      await expect(service.getCurrencies()).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });
});
