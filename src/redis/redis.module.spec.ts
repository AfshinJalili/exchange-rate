import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule, REDIS_CLIENT } from './redis.module';
import { createClient } from 'redis';

describe('RedisModule', () => {
  let client: ReturnType<typeof createClient>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RedisModule],
    }).compile();
    client = moduleRef.get(REDIS_CLIENT);
  });

  afterAll(async () => {
    if (client) await client.quit();
    if (moduleRef) await moduleRef.close();
  });

  it('should connect to Redis and PING', async () => {
    const result = await client.ping();
    expect(result).toBe('PONG');
  });
});
