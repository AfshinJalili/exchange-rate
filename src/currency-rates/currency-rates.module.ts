import { Module } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';
import { CurrencyRatesController } from './currency-rates.controller';

@Module({
  providers: [CurrencyRatesService],
  controllers: [CurrencyRatesController],
})
export class CurrencyRatesModule {}
