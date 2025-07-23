import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { CurrencyRatesModule } from './currency-rates/currency-rates.module';

@Module({
  imports: [RedisModule, CurrencyRatesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
