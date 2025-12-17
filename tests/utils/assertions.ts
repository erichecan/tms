// 断言工具 - 规则引擎与 Google Maps 断言
// 创建时间: 2025-12-10 20:00:00
// 用途: 提供规则引擎响应结构断言、Google Maps 调用断言等工具函数

import { expect } from '@playwright/test';
import { NetworkRequest, NetworkResponse, CDPSessionManager } from './cdp';

/**
 * 规则引擎响应结构
 */
export interface RuleEngineResponse {
  ruleId?: string;
  ruleName?: string;
  amount: number;
  currency: string;
  breakdown: Record<string, any>;
  appliedAt: string;
}

/**
 * Google Maps API 调用信息
 */
export interface GoogleMapsCall {
  url: string;
  apiType: 'js' | 'geocoding' | 'directions' | 'distance-matrix' | 'static' | 'places' | 'other';
  params?: Record<string, string>;
}

/**
 * 断言规则引擎请求
 * @param request 网络请求
 * @param expectedType 期望的计费类型 ('distance' | 'time')
 */
export function assertRuleEngineRequest(
  request: NetworkRequest,
  expectedType: 'distance' | 'time'
): void {
  expect(request.url).toBeTruthy();
  expect(request.method).toMatch(/POST|GET/i);

  // 检查请求体或 URL 参数中是否包含计费类型
  const requestData = request.postData || request.url;
  expect(requestData).toBeTruthy();

  if (expectedType === 'distance') {
    // 路程计费应该包含距离相关参数
    const hasDistanceParam = 
      requestData.includes('distanceKm') ||
      requestData.includes('distance') ||
      requestData.includes('type=distance') ||
      requestData.includes('"type":"distance"');
    expect(hasDistanceParam, '路程计费请求应包含距离参数').toBe(true);
  } else if (expectedType === 'time') {
    // 时间计费应该包含时间相关参数
    const hasTimeParam = 
      requestData.includes('serviceMinutes') ||
      requestData.includes('timeWindow') ||
      requestData.includes('type=time') ||
      requestData.includes('"type":"time"');
    expect(hasTimeParam, '时间计费请求应包含时间参数').toBe(true);
  }
}

/**
 * 断言规则引擎响应结构
 * @param response 网络响应
 * @returns 解析后的规则引擎响应
 */
export function assertRuleEngineResponse(response: NetworkResponse): RuleEngineResponse {
  expect(response.status, '规则引擎响应状态码应为 200').toBe(200);
  expect(response.body, '规则引擎响应应包含响应体').toBeTruthy();

  let parsedBody: any;
  try {
    parsedBody = JSON.parse(response.body || '{}');
  } catch (error) {
    throw new Error(`规则引擎响应不是有效的 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 验证响应结构
  expect(parsedBody, '规则引擎响应应包含 amount 字段').toHaveProperty('amount');
  expect(typeof parsedBody.amount, 'amount 应为数字').toBe('number');
  expect(parsedBody.amount, 'amount 应为正数').toBeGreaterThan(0);

  expect(parsedBody, '规则引擎响应应包含 currency 字段').toHaveProperty('currency');
  expect(typeof parsedBody.currency, 'currency 应为字符串').toBe('string');

  expect(parsedBody, '规则引擎响应应包含 breakdown 字段').toHaveProperty('breakdown');
  expect(typeof parsedBody.breakdown, 'breakdown 应为对象').toBe('object');

  if (parsedBody.ruleId) {
    expect(typeof parsedBody.ruleId, 'ruleId 应为字符串').toBe('string');
  }

  if (parsedBody.ruleName) {
    expect(typeof parsedBody.ruleName, 'ruleName 应为字符串').toBe('string');
  }

  if (parsedBody.appliedAt) {
    expect(typeof parsedBody.appliedAt, 'appliedAt 应为字符串').toBe('string');
  }

  return parsedBody as RuleEngineResponse;
}

/**
 * 断言 Google Maps API 调用
 * @param request 网络请求
 * @returns Google Maps API 调用信息
 */
export function assertGoogleMapsCall(request: NetworkRequest): GoogleMapsCall {
  const url = request.url;
  expect(url, '请求 URL 应包含 Google Maps 相关域名').toMatch(
    /googleapis\.com|gstatic\.com|google\.com\/maps/
  );

  let apiType: GoogleMapsCall['apiType'] = 'other';
  const params: Record<string, string> = {};

  // 识别 API 类型
  if (url.includes('/maps/api/js')) {
    apiType = 'js';
  } else if (url.includes('/geocode')) {
    apiType = 'geocoding';
    // 解析 geocoding 参数
    const addressMatch = url.match(/address=([^&]+)/);
    if (addressMatch) {
      params.address = decodeURIComponent(addressMatch[1]);
    }
    const latlngMatch = url.match(/latlng=([^&]+)/);
    if (latlngMatch) {
      params.latlng = decodeURIComponent(latlngMatch[1]);
    }
  } else if (url.includes('/directions')) {
    apiType = 'directions';
    // 解析 directions 参数
    const originMatch = url.match(/origin=([^&]+)/);
    if (originMatch) {
      params.origin = decodeURIComponent(originMatch[1]);
    }
    const destinationMatch = url.match(/destination=([^&]+)/);
    if (destinationMatch) {
      params.destination = decodeURIComponent(destinationMatch[1]);
    }
  } else if (url.includes('/distancematrix')) {
    apiType = 'distance-matrix';
    // 解析 distance matrix 参数
    const originsMatch = url.match(/origins=([^&]+)/);
    if (originsMatch) {
      params.origins = decodeURIComponent(originsMatch[1]);
    }
    const destinationsMatch = url.match(/destinations=([^&]+)/);
    if (destinationsMatch) {
      params.destinations = decodeURIComponent(destinationsMatch[1]);
    }
  } else if (url.includes('/staticmap')) {
    apiType = 'static';
  } else if (url.includes('/places')) {
    apiType = 'places';
  }

  return {
    url,
    apiType,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
}

/**
 * 验证 Google Maps 是否被加载和调用
 * @param cdpManager CDP 会话管理器
 * @param expectedEndpoints 期望的端点列表（可选）
 * @returns Google Maps 调用列表
 */
export function verifyGoogleMapsCalls(
  cdpManager: CDPSessionManager,
  expectedEndpoints?: string[]
): GoogleMapsCall[] {
  const googleMapsPatterns = [
    /googleapis\.com\/maps\/api/,
    /gstatic\.com\/.*maps/,
    /google\.com\/maps/,
  ];

  const allCalls: GoogleMapsCall[] = [];

  for (const pattern of googleMapsPatterns) {
    const requests = cdpManager.getMatchingRequests(pattern);
    for (const request of requests) {
      try {
        const call = assertGoogleMapsCall(request);
        allCalls.push(call);
      } catch (error) {
        // 忽略不符合预期的调用
      }
    }
  }

  // 验证至少有一个 Google Maps 调用
  expect(
    allCalls.length,
    '应至少检测到一个 Google Maps API 调用'
  ).toBeGreaterThan(0);

  // 验证期望的端点（如果提供）
  if (expectedEndpoints && expectedEndpoints.length > 0) {
    const foundEndpoints = allCalls.map(call => call.apiType);
    for (const expected of expectedEndpoints) {
      expect(
        foundEndpoints,
        `应检测到 Google Maps ${expected} API 调用`
      ).toContain(expected);
    }
  }

  return allCalls;
}

/**
 * 验证规则引擎是否被调用
 * @param cdpManager CDP 会话管理器
 * @param ruleEngineUrl 规则引擎 URL（可选，用于精确匹配）
 * @param expectedType 期望的计费类型
 * @returns 规则引擎请求-响应对列表
 */
export function verifyRuleEngineCall(
  cdpManager: CDPSessionManager,
  ruleEngineUrl?: string,
  expectedType?: 'distance' | 'time'
): Array<{ request: NetworkRequest; response?: NetworkResponse }> {
  let pattern: string | RegExp;

  if (ruleEngineUrl) {
    // 使用精确 URL 匹配
    pattern = ruleEngineUrl;
  } else {
    // 使用通用规则引擎路径匹配
    pattern = /\/api\/(rules|pricing|shipments).*\/evaluate|rule.*engine/i;
  }

  const pairs = cdpManager.getRequestResponsePairs(pattern);

  // 验证至少有一个规则引擎调用
  expect(
    pairs.length,
    '应至少检测到一个规则引擎 API 调用'
  ).toBeGreaterThan(0);

  // 验证请求和响应
  for (const pair of pairs) {
    if (expectedType) {
      assertRuleEngineRequest(pair.request, expectedType);
    }

    if (pair.response) {
      assertRuleEngineResponse(pair.response);
    }
  }

  return pairs;
}

/**
 * 从响应中提取规则引擎结果
 * @param response 网络响应
 * @returns 规则引擎响应对象
 */
export function extractRuleEngineResult(response: NetworkResponse): RuleEngineResponse {
  return assertRuleEngineResponse(response);
}

/**
 * 验证 UI 中显示的价格信息
 * @param page Playwright Page 对象
 * @param expectedAmount 期望的金额（可选）
 */
export async function verifyPricingInUI(
  page: any,
  expectedAmount?: number
): Promise<void> {
  // 查找价格相关的元素（可能的选择器）
  const priceSelectors = [
    '[class*="price"]',
    '[class*="cost"]',
    '[class*="amount"]',
    'text=/\\$?\\d+(\\.\\d{2})?/',
  ];

  let foundPrice = false;
  for (const selector of priceSelectors) {
    const elements = await page.locator(selector).all();
    if (elements.length > 0) {
      foundPrice = true;
      
      if (expectedAmount !== undefined) {
        // 尝试从元素中提取金额并验证
        for (const element of elements) {
          const text = await element.textContent();
          if (text) {
            const amountMatch = text.match(/\$?(\d+\.?\d*)/);
            if (amountMatch) {
              const amount = parseFloat(amountMatch[1]);
              expect(
                amount,
                `UI 中显示的价格 ${amount} 应接近期望值 ${expectedAmount}`
              ).toBeCloseTo(expectedAmount, 1);
            }
          }
        }
      }
      break;
    }
  }

  expect(foundPrice, 'UI 中应显示价格信息').toBe(true);
}
