// 币种相关API服务
// 创建时间: 2025-09-26 16:40:00

import { api } from './api';

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  updatedAt: string;
  effectiveDate: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  convertedAt: string;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
}

// 币种相关API调用
export const currencyApi = {
  // 获取支持的币种列表
  getSupportedCurrencies: () => api.get<SupportedCurrency[]>('/currency/supported'),
  
  // 获取汇率
  getExchangeRate: (fromCurrency: string, toCurrency: string, forceRefresh?: boolean) => 
    api.get<number>(`/currency/rate/${fromCurrency}/${toCurrency}`, { 
      params: { forceRefresh } 
    }),
  
  // 货币转换
  convertCurrency: (fromCurrency: string, toCurrency: string, amount: number) =>
    api.post<CurrencyConversion>('/currency/convert', {
      fromCurrency,
      toCurrency,
      amount
    }),
  
  // 更新汇率
  updateExchangeRate: (fromCurrency: string, toCurrency: string, rate: number, source?: string) =>
    api.post('/currency/rate', {
      fromCurrency,
      toCurrency,
      rate,
      source: source || 'manual'
    }),
  
  // 批量更新汇率
  updateExchangeRates: (rates: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
  }>) => api.post('/currency/rates/batch', { rates }),
  
  // 获取汇率历史
  getExchangeRateHistory: (fromCurrency: string, toCurrency: string, days?: number) =>
    api.get<ExchangeRate[]>(`/currency/rate/${fromCurrency}/${toCurrency}/history`, {
      params: { days: days || 30 }
    })
};
