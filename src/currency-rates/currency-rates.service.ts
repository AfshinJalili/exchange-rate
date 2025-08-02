import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from 'src/redis/redis.module';

@Injectable()
export class CurrencyRatesService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async getCurrencies() {
    const cachedCurrencies = await this.redisClient.get('currencies');
    if (cachedCurrencies) {
      const currencies = JSON.parse(cachedCurrencies) as Record<string, string>;
      return { currencies };
    }

    const request = new Request(
      `${process.env.FAST_FOREX_API_URL}/currencies?api_key=${process.env.FAST_FOREX_API_KEY}`,
      {
        headers: new Headers({
          Accept: 'application/json',
        }),
      },
    );
    const response = await fetch(request);
    const data = (await response.json()) as {
      currencies: Record<string, string>;
    };

    await this.redisClient.set('currencies', JSON.stringify(data.currencies));

    return { currencies: data.currencies };
  }
}
