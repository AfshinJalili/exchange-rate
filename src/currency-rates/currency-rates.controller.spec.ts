import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { CurrencyRatesController } from './currency-rates.controller';
import { CurrencyRatesService } from './currency-rates.service';

describe('CurrencyRatesController', () => {
  let controller: CurrencyRatesController;
  let service: CurrencyRatesService;

  const mockCurrencies = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
  };

  beforeEach(async () => {
    const mockService = {
      getCurrencies: jest.fn(),
      getRate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyRatesController],
      providers: [
        {
          provide: CurrencyRatesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CurrencyRatesController>(CurrencyRatesController);
    service = module.get<CurrencyRatesService>(CurrencyRatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCurrencies', () => {
    it('should return all currencies', async () => {
      jest.spyOn(service, 'getCurrencies').mockResolvedValue({
        currencies: mockCurrencies,
      });

      const result = await controller.getAllCurrencies();

      expect(result).toEqual({ currencies: mockCurrencies });
      expect(service.getCurrencies).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      const error = new HttpException('API Error', 500);
      jest.spyOn(service, 'getCurrencies').mockRejectedValue(error);

      await expect(controller.getAllCurrencies()).rejects.toThrow(error);
      expect(service.getCurrencies).toHaveBeenCalledTimes(1);
    });

    it('should handle empty currencies response', async () => {
      jest.spyOn(service, 'getCurrencies').mockResolvedValue({
        currencies: {},
      });

      const result = await controller.getAllCurrencies();

      expect(result).toEqual({ currencies: {} });
      expect(service.getCurrencies).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRate', () => {
    it('should return exchange rate for valid currencies', async () => {
      const mockRate = { rate: 0.85 };
      jest.spyOn(service, 'getRate').mockResolvedValue(mockRate);

      const result = await controller.getRate('USD', 'EUR');

      expect(result).toEqual(mockRate);
      expect(service.getRate).toHaveBeenCalledWith('USD', 'EUR');
    });

    it('should handle invalid currency codes', async () => {
      const error = new BadRequestException(
        'Invalid currency code: INVALID or EUR',
        'Invalid currency code',
      );
      jest.spyOn(service, 'getRate').mockRejectedValue(error);

      await expect(controller.getRate('INVALID', 'EUR')).rejects.toThrow(error);
      expect(service.getRate).toHaveBeenCalledWith('INVALID', 'EUR');
    });

    it('should handle API errors', async () => {
      const error = new HttpException('Failed to get rate for USD/EUR', 500);
      jest.spyOn(service, 'getRate').mockRejectedValue(error);

      await expect(controller.getRate('USD', 'EUR')).rejects.toThrow(error);
      expect(service.getRate).toHaveBeenCalledWith('USD', 'EUR');
    });

    it('should handle case-insensitive currency codes', async () => {
      const mockRate = { rate: 0.85 };
      jest.spyOn(service, 'getRate').mockResolvedValue(mockRate);

      const result = await controller.getRate('usd', 'eur');

      expect(result).toEqual(mockRate);
      expect(service.getRate).toHaveBeenCalledWith('usd', 'eur');
    });

    it('should handle empty rate response', async () => {
      const mockRate = { rate: 0 };
      jest.spyOn(service, 'getRate').mockResolvedValue(mockRate);

      const result = await controller.getRate('USD', 'EUR');

      expect(result).toEqual(mockRate);
      expect(service.getRate).toHaveBeenCalledWith('USD', 'EUR');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      jest.spyOn(service, 'getRate').mockRejectedValue(error);

      await expect(controller.getRate('USD', 'EUR')).rejects.toThrow(error);
      expect(service.getRate).toHaveBeenCalledWith('USD', 'EUR');
    });
  });

  describe('edge cases', () => {
    it('should handle null query parameters', async () => {
      const mockRate = { rate: 0.85 };
      jest.spyOn(service, 'getRate').mockResolvedValue(mockRate);

      const result = await controller.getRate(null as any, 'EUR');

      expect(result).toEqual(mockRate);
      expect(service.getRate).toHaveBeenCalledWith(null, 'EUR');
    });

    it('should handle undefined query parameters', async () => {
      const mockRate = { rate: 0.85 };
      jest.spyOn(service, 'getRate').mockResolvedValue(mockRate);

      const result = await controller.getRate(undefined as any, 'EUR');

      expect(result).toEqual(mockRate);
      expect(service.getRate).toHaveBeenCalledWith(undefined, 'EUR');
    });

    it('should handle empty string parameters', async () => {
      const error = new BadRequestException(
        'Invalid currency code:  or EUR',
        'Invalid currency code',
      );
      jest.spyOn(service, 'getRate').mockRejectedValue(error);

      await expect(controller.getRate('', 'EUR')).rejects.toThrow(error);
      expect(service.getRate).toHaveBeenCalledWith('', 'EUR');
    });
  });
});
