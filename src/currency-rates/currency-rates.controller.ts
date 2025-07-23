/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';

@Controller('currency-rates')
export class CurrencyRatesController {
    constructor(private readonly currencyRatesService: CurrencyRatesService) { }

    @Get()
    getRates() {
        // Future logic to return currency rates
        return { message: 'Currency rates endpoint' };
    }
} 