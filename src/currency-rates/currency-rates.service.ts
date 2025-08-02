import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from 'src/redis/redis.module';

@Injectable()
export class CurrencyRatesService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async getCurrencies() {
    const cachedCurrencies = await this.redisClient.hGetAll('currencies');
    if (Object.keys(cachedCurrencies).length > 0) {
      return { currencies: cachedCurrencies as Record<string, string> };
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

    await this.redisClient.hSet('currencies', data.currencies);

    return { currencies: data.currencies };
  }

  async getRate(from: string, to: string) {
    const currencies = await this.getCurrencies();
    if (!currencies.currencies[from] || !currencies.currencies[to]) {
      throw new BadRequestException(
        `Invalid currency code: ${from} or ${to}`,
        'Invalid currency code',
      );
    }

    const cachedRate = await this.redisClient.hGet(`rate:${from}`, to);
    if (cachedRate) {
      return { rate: JSON.parse(cachedRate) as number };
    }

    const request = new Request(
      `${process.env.FAST_FOREX_API_URL}/fetch-all?from=${from}&api_key=${process.env.FAST_FOREX_API_KEY}`,
      {
        headers: new Headers({
          Accept: 'application/json',
        }),
      },
    );
    const response = await fetch(request);
    const data = (await response.json()) as {
      base: string;
      results: Record<string, number>;
      updated: string;
      ms: number;
    };

    const hashKey = `rate:${data.base}`;

    await this.redisClient.hSet(hashKey, {
      ...data.results,
      updated: data.updated,
    });

    return { rate: data.results[to] };
  }
}
