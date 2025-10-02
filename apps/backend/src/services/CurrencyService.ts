// 币种和汇率管理服务
// 创建时间: 2025-09-26 16:35:00

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@tms/shared-types';

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  updatedAt: Date;
  effectiveDate: Date;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  convertedAt: Date;
}

export class CurrencyService {
  private dbService: DatabaseService;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private lastUpdateTime: Date | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 获取支持的币种列表
   */
  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
    return SUPPORTED_CURRENCIES.map(code => ({
      code,
      name: CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES],
      symbol: CURRENCY_SYMBOLS[code as keyof typeof CURRENCY_SYMBOLS]
    }));
  }

  /**
   * 获取汇率
   * @param fromCurrency 源币种
   * @param toCurrency 目标币种
   * @param forceRefresh 是否强制刷新
   */
  async getExchangeRate(
    fromCurrency: string, 
    toCurrency: string, 
    forceRefresh: boolean = false
  ): Promise<number> {
    try {
      // 相同币种返回1
      if (fromCurrency === toCurrency) {
        return 1;
      }

      const rateKey = `${fromCurrency}_${toCurrency}`;
      
      // 检查缓存
      if (!forceRefresh && this.exchangeRates.has(rateKey)) {
        const cachedRate = this.exchangeRates.get(rateKey)!;
        const now = new Date();
        if (now.getTime() - cachedRate.updatedAt.getTime() < this.CACHE_DURATION) {
          return cachedRate.rate;
        }
      }

      // 从数据库获取最新汇率
      const query = `
        SELECT * FROM exchange_rates 
        WHERE from_currency = $1 AND to_currency = $2 
        ORDER BY effective_date DESC, updated_at DESC 
        LIMIT 1
      `;
      
      const result = await this.dbService.query(query, [fromCurrency, toCurrency]);
      
      if (result.length > 0) {
        const rate = result[0];
        const exchangeRate: ExchangeRate = {
          id: rate.id,
          fromCurrency: rate.from_currency,
          toCurrency: rate.to_currency,
          rate: parseFloat(rate.rate),
          source: rate.source,
          updatedAt: rate.updated_at,
          effectiveDate: rate.effective_date
        };
        
        this.exchangeRates.set(rateKey, exchangeRate);
        return exchangeRate.rate;
      }

      // 如果没有找到汇率，尝试反向汇率
      const reverseQuery = `
        SELECT * FROM exchange_rates 
        WHERE from_currency = $1 AND to_currency = $2 
        ORDER BY effective_date DESC, updated_at DESC 
        LIMIT 1
      `;
      
      const reverseResult = await this.dbService.query(reverseQuery, [toCurrency, fromCurrency]);
      
      if (reverseResult.length > 0) {
        const reverseRate = 1 / parseFloat(reverseResult[0].rate);
        return reverseRate;
      }

      // 如果都没有找到，返回默认汇率（这里可以集成外部API）
      logger.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}, using default`);
      return this.getDefaultExchangeRate(fromCurrency, toCurrency);
      
    } catch (error) {
      logger.error('Failed to get exchange rate:', error);
      return this.getDefaultExchangeRate(fromCurrency, toCurrency);
    }
  }

  /**
   * 货币转换
   * @param fromCurrency 源币种
   * @param toCurrency 目标币种
   * @param amount 金额
   */
  async convertCurrency(
    fromCurrency: string, 
    toCurrency: string, 
    amount: number
  ): Promise<CurrencyConversion> {
    try {
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;

      return {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100, // 保留2位小数
        rate,
        convertedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to convert currency:', error);
      throw error;
    }
  }

  /**
   * 更新汇率
   * @param fromCurrency 源币种
   * @param toCurrency 目标币种
   * @param rate 汇率
   * @param source 数据源
   */
  async updateExchangeRate(
    fromCurrency: string, 
    toCurrency: string, 
    rate: number, 
    source: string = 'manual'
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO exchange_rates (id, from_currency, to_currency, rate, source, effective_date, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (from_currency, to_currency, effective_date) 
        DO UPDATE SET 
          rate = EXCLUDED.rate,
          source = EXCLUDED.source,
          updated_at = EXCLUDED.updated_at
      `;

      const id = `rate_${fromCurrency}_${toCurrency}_${Date.now()}`;
      const now = new Date();
      
      await this.dbService.query(query, [
        id, fromCurrency, toCurrency, rate, source, now, now
      ]);

      // 更新缓存
      const rateKey = `${fromCurrency}_${toCurrency}`;
      this.exchangeRates.set(rateKey, {
        id,
        fromCurrency,
        toCurrency,
        rate,
        source,
        updatedAt: now,
        effectiveDate: now
      });

      logger.info(`Exchange rate updated: ${fromCurrency} to ${toCurrency} = ${rate}`);
    } catch (error) {
      logger.error('Failed to update exchange rate:', error);
      throw error;
    }
  }

  /**
   * 批量更新汇率
   * @param rates 汇率数组
   */
  async updateExchangeRates(rates: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
  }>): Promise<void> {
    try {
      for (const rate of rates) {
        await this.updateExchangeRate(
          rate.fromCurrency, 
          rate.toCurrency, 
          rate.rate, 
          rate.source || 'batch_update'
        );
      }
      logger.info(`Updated ${rates.length} exchange rates`);
    } catch (error) {
      logger.error('Failed to update exchange rates:', error);
      throw error;
    }
  }

  /**
   * 获取默认汇率（用于测试或备用）
   */
  private getDefaultExchangeRate(fromCurrency: string, toCurrency: string): number {
    // 默认汇率 - 基于 CAD (Canadian Dollar) 2025-10-02 20:15:00
    const defaultRates: Record<string, Record<string, number>> = {
      'CAD': { 'USD': 0.74, 'EUR': 0.68, 'GBP': 0.58, 'CAD': 1.0 },
      'USD': { 'CAD': 1.35, 'EUR': 0.92, 'GBP': 0.79, 'USD': 1.0 },
      'EUR': { 'CAD': 1.47, 'USD': 1.09, 'GBP': 0.86, 'EUR': 1.0 },
      'GBP': { 'CAD': 1.72, 'USD': 1.27, 'EUR': 1.16, 'GBP': 1.0 }
    };

    return defaultRates[fromCurrency]?.[toCurrency] || 1;
  }

  /**
   * 格式化金额显示
   * @param amount 金额
   * @param currency 币种
   * @param locale 地区设置
   */
  formatAmount(amount: number, currency: string, locale: string = 'zh-CN'): string {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // 如果Intl不支持该币种，使用简单格式
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * 获取汇率历史
   * @param fromCurrency 源币种
   * @param toCurrency 目标币种
   * @param days 天数
   */
  async getExchangeRateHistory(
    fromCurrency: string, 
    toCurrency: string, 
    days: number = 30
  ): Promise<ExchangeRate[]> {
    try {
      const query = `
        SELECT * FROM exchange_rates 
        WHERE from_currency = $1 AND to_currency = $2 
        AND effective_date >= $3
        ORDER BY effective_date DESC
      `;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const result = await this.dbService.query(query, [fromCurrency, toCurrency, startDate]);
      
      return result.map(row => ({
        id: row.id,
        fromCurrency: row.from_currency,
        toCurrency: row.to_currency,
        rate: parseFloat(row.rate),
        source: row.source,
        updatedAt: row.updated_at,
        effectiveDate: row.effective_date
      }));
    } catch (error) {
      logger.error('Failed to get exchange rate history:', error);
      throw error;
    }
  }
}
