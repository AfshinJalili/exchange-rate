/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';

@Controller('currency-rates')
export class CurrencyRatesController {
    constructor(private readonly currencyRatesService: CurrencyRatesService) { }

    @Get('rate')
    getRates(@Query('from') from: string, @Query('to') to: string) {
        return { from, to, rate: 1.2 };
    }

    @Get('currencies')
    getAllCurrencies() {
        return this.currencyRatesService.getCurrencies();
    }
} 