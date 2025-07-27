import { Module, Global, Logger } from '@nestjs/common';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const logger = new Logger('RedisModule');

        // Default to localhost if REDIS_URL is not set
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        logger.log(`Connecting to Redis at: ${redisUrl}`);

        const client = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
              }
              logger.log(`Redis reconnection attempt ${retries}`);
              return Math.min(retries * 100, 3000);
            },
            connectTimeout: 10000,
          },
        });

        client.on('error', (err) => {
          logger.error('Redis Client Error:', err);
        });

        client.on('connect', () => {
          logger.log('Redis Client Connected');
        });

        client.on('ready', () => {
          logger.log('Redis Client Ready');
        });

        client.on('end', () => {
          logger.log('Redis Client Connection Ended');
        });

        try {
          await client.connect();
          logger.log('Redis connection established successfully');
          return client;
        } catch (error) {
          logger.error('Failed to connect to Redis:', error);
          throw error;
        }
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
