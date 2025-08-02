import { Module } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';
import { CurrencyRatesController } from './currency-rates.controller';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [CurrencyRatesService],
  controllers: [CurrencyRatesController],
})
export class CurrencyRatesModule {}
