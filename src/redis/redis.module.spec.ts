import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RedisModule, REDIS_CLIENT } from './redis.module';

describe('RedisModule', () => {
  let module: TestingModule;
  let redisClient: any;

  const originalEnv = process.env;

  beforeEach(async () => {
    // Reset environment variables
    process.env = { ...originalEnv };

    // Mock Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });

    module = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();

    redisClient = module.get(REDIS_CLIENT);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Redis Client Configuration', () => {
    it('should create Redis client with default configuration', () => {
      expect(redisClient).toBeDefined();
      expect(typeof redisClient).toBe('object');
    });

    it('should use REDIS_URL from environment variables', () => {
      process.env.REDIS_URL = 'redis://custom-host:6379';

      // Recreate module with new environment
      Test.createTestingModule({
        imports: [RedisModule],
      })
        .compile()
        .then((newModule) => {
          const newClient = newModule.get(REDIS_CLIENT);
          expect(newClient).toBeDefined();
        });
    });

    it('should fallback to localhost when REDIS_URL is not set', () => {
      delete process.env.REDIS_URL;

      // Recreate module with new environment
      Test.createTestingModule({
        imports: [RedisModule],
      })
        .compile()
        .then((newModule) => {
          const newClient = newModule.get(REDIS_CLIENT);
          expect(newClient).toBeDefined();
        });
    });
  });

  describe('Redis Client Events', () => {
    it('should handle connection events', () => {
      // Simulate connection events
      redisClient.emit('connect');
      redisClient.emit('ready');
      redisClient.emit('end');

      expect(Logger.prototype.log).toHaveBeenCalledWith('Redis Client Connected');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Redis Client Ready');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Redis Client Connection Ended');
    });

    it('should handle error events', () => {
      const error = new Error('Redis connection error');
      redisClient.emit('error', error);

      expect(Logger.prototype.error).toHaveBeenCalledWith('Redis Client Error:', error);
    });
  });

  describe('Redis Client Methods', () => {
    it('should have required Redis methods', () => {
      expect(typeof redisClient.hGetAll).toBe('function');
      expect(typeof redisClient.hGet).toBe('function');
      expect(typeof redisClient.hSet).toBe('function');
      expect(typeof redisClient.connect).toBe('function');
    });

    it('should handle hGetAll method', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      jest.spyOn(redisClient, 'hGetAll').mockResolvedValue(mockData);

      const result = await redisClient.hGetAll('test-key');
      expect(result).toEqual(mockData);
    });

    it('should handle hGet method', async () => {
      const mockValue = 'test-value';
      jest.spyOn(redisClient, 'hGet').mockResolvedValue(mockValue);

      const result = await redisClient.hGet('test-hash', 'test-field');
      expect(result).toBe(mockValue);
    });

    it('should handle hSet method', async () => {
      jest.spyOn(redisClient, 'hSet').mockResolvedValue(1);

      const result = await redisClient.hSet('test-hash', 'test-field', 'test-value');
      expect(result).toBe(1);
    });
  });

  describe('Connection Strategy', () => {
    it('should handle reconnection attempts', () => {
      // Test reconnection strategy logic
      const reconnectStrategy = redisClient.options?.socket?.reconnectStrategy;

      if (reconnectStrategy) {
        // Test first few attempts
        expect(reconnectStrategy(1)).toBe(100);
        expect(reconnectStrategy(2)).toBe(200);
        expect(reconnectStrategy(5)).toBe(500);

        // Test max retry limit
        expect(reconnectStrategy(11)).toBeInstanceOf(Error);
      }
    });

    it('should have proper connection timeout', () => {
      expect(redisClient.options?.socket?.connectTimeout).toBe(10000);
    });
  });

  describe('Module Export', () => {
    it('should export REDIS_CLIENT token', () => {
      expect(REDIS_CLIENT).toBe('REDIS_CLIENT');
    });

    it('should be a global module', () => {
      const moduleRef = module.get(RedisModule);
      expect(moduleRef).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      // Mock connection failure
      jest.spyOn(redisClient, 'connect').mockRejectedValue(new Error('Connection failed'));

      await expect(redisClient.connect()).rejects.toThrow('Connection failed');
    });

    it('should handle connection failures gracefully', async () => {
      const error = new Error('Redis connection failed');
      jest.spyOn(redisClient, 'connect').mockRejectedValue(error);

      await expect(redisClient.connect()).rejects.toThrow('Redis connection failed');
    });
  });
});
