/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyRatesService } from './currency-rates.service';

@Controller('currency-rates')
export class CurrencyRatesController {
    constructor(private readonly currencyRatesService: CurrencyRatesService) { }

    @Get('rate')
    getRate(@Query('from') from: string, @Query('to') to: string) {
        return this.currencyRatesService.getRate(from, to);
    }

    @Get('currencies')
    getAllCurrencies() {
        return this.currencyRatesService.getCurrencies();
    }
} 