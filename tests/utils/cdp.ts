// CDP (Chrome DevTools Protocol) 工具封装
// 创建时间: 2025-12-10 20:00:00
// 用途: 封装 CDP 会话附加、网络监听、console 采集等功能

import { Page, BrowserContext, CDPSession } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 网络请求事件
 */
export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
}

/**
 * 网络响应事件
 */
export interface NetworkResponse {
  requestId: string;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

/**
 * Console 消息
 */
export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  url?: string;
  lineNumber?: number;
}

/**
 * CDP 会话管理器
 */
export class CDPSessionManager {
  private cdpSession: CDPSession | null = null;
  private networkRequests: Map<string, NetworkRequest> = new Map();
  private networkResponses: Map<string, NetworkResponse> = new Map();
  private consoleMessages: ConsoleMessage[] = [];
  private networkEnabled: boolean = false;

  /**
   * 附加 CDP 会话到页面
   * @param page Playwright Page 对象
   */
  async attachToPage(page: Page): Promise<void> {
    try {
      this.cdpSession = await page.context().newCDPSession(page);
      await this.enableNetworkMonitoring();
      await this.enableConsoleMonitoring();
    } catch (error) {
      throw new Error(`Failed to attach CDP session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 启用网络监控
   */
  private async enableNetworkMonitoring(): Promise<void> {
    if (!this.cdpSession) {
      throw new Error('CDP session not attached');
    }

    // 启用 Network 域
    await this.cdpSession.send('Network.enable');
    this.networkEnabled = true;

    // 监听请求发送事件
    this.cdpSession.on('Network.requestWillBeSent', (event: any) => {
      const request: NetworkRequest = {
        requestId: event.requestId,
        url: event.request.url,
        method: event.request.method,
        headers: event.request.headers || {},
        postData: event.request.postData,
        timestamp: event.timestamp || Date.now(),
      };
      this.networkRequests.set(event.requestId, request);
    });

    // 监听响应接收事件
    this.cdpSession.on('Network.responseReceived', async (event: any) => {
      const response: NetworkResponse = {
        requestId: event.requestId,
        url: event.response.url,
        status: event.response.status,
        statusText: event.response.statusText,
        headers: event.response.headers || {},
        timestamp: event.timestamp || Date.now(),
      };

      // 尝试获取响应体（仅对文本类型）
      try {
        const responseBody = await this.cdpSession?.send('Network.getResponseBody', {
          requestId: event.requestId,
        });
        if (responseBody && !responseBody.base64Encoded) {
          response.body = responseBody.body;
        }
      } catch {
        // 忽略无法获取响应体的错误（某些响应类型不支持）
      }

      this.networkResponses.set(event.requestId, response);
    });
  }

  /**
   * 启用 Console 监控
   */
  private async enableConsoleMonitoring(): Promise<void> {
    if (!this.cdpSession) {
      throw new Error('CDP session not attached');
    }

    // 启用 Runtime 域以监听 console 消息
    await this.cdpSession.send('Runtime.enable');

    // 监听 console API 调用
    this.cdpSession.on('Runtime.consoleAPICalled', (event: any) => {
      const message: ConsoleMessage = {
        type: event.type || 'log',
        text: event.args.map((arg: any) => {
          if (arg.type === 'string') {
            return arg.value;
          } else if (arg.type === 'object' && arg.preview) {
            return JSON.stringify(arg.preview.properties);
          }
          return String(arg.value || '');
        }).join(' '),
        timestamp: Date.now(),
        url: event.stackTrace?.callFrames?.[0]?.url,
        lineNumber: event.stackTrace?.callFrames?.[0]?.lineNumber,
      };
      this.consoleMessages.push(message);
    });

    // 监听异常
    this.cdpSession.on('Runtime.exceptionThrown', (event: any) => {
      const message: ConsoleMessage = {
        type: 'error',
        text: event.exceptionDetails?.text || 'Unknown exception',
        timestamp: Date.now(),
        url: event.exceptionDetails?.url,
        lineNumber: event.exceptionDetails?.lineNumber,
      };
      this.consoleMessages.push(message);
    });
  }

  /**
   * 获取匹配的网络请求
   * @param urlPattern URL 模式（字符串或正则表达式）
   * @returns 匹配的请求列表
   */
  getMatchingRequests(urlPattern: string | RegExp): NetworkRequest[] {
    const requests: NetworkRequest[] = [];
    
    for (const request of this.networkRequests.values()) {
      if (typeof urlPattern === 'string') {
        if (request.url.includes(urlPattern)) {
          requests.push(request);
        }
      } else {
        if (urlPattern.test(request.url)) {
          requests.push(request);
        }
      }
    }
    
    return requests;
  }

  /**
   * 获取匹配的网络响应
   * @param urlPattern URL 模式（字符串或正则表达式）
   * @returns 匹配的响应列表
   */
  getMatchingResponses(urlPattern: string | RegExp): NetworkResponse[] {
    const responses: NetworkResponse[] = [];
    
    for (const response of this.networkResponses.values()) {
      if (typeof urlPattern === 'string') {
        if (response.url.includes(urlPattern)) {
          responses.push(response);
        }
      } else {
        if (urlPattern.test(response.url)) {
          responses.push(response);
        }
      }
    }
    
    return responses;
  }

  /**
   * 获取完整的请求-响应对
   * @param urlPattern URL 模式
   * @returns 请求-响应对列表
   */
  getRequestResponsePairs(urlPattern: string | RegExp): Array<{
    request: NetworkRequest;
    response?: NetworkResponse;
  }> {
    const pairs: Array<{ request: NetworkRequest; response?: NetworkResponse }> = [];
    const requests = this.getMatchingRequests(urlPattern);
    
    for (const request of requests) {
      const response = this.networkResponses.get(request.requestId);
      pairs.push({ request, response });
    }
    
    return pairs;
  }

  /**
   * 获取 Console 消息
   * @param type 消息类型（可选）
   * @returns Console 消息列表
   */
  getConsoleMessages(type?: string): ConsoleMessage[] {
    if (type) {
      return this.consoleMessages.filter(msg => msg.type === type);
    }
    return [...this.consoleMessages];
  }

  /**
   * 获取所有网络事件摘要
   */
  getNetworkSummary(): {
    requests: NetworkRequest[];
    responses: NetworkResponse[];
    consoleMessages: ConsoleMessage[];
  } {
    return {
      requests: Array.from(this.networkRequests.values()),
      responses: Array.from(this.networkResponses.values()),
      consoleMessages: [...this.consoleMessages],
    };
  }

  /**
   * 保存网络事件摘要到 JSON 文件
   * @param filePath 文件路径
   */
  async saveNetworkSummary(filePath: string): Promise<void> {
    const summary = this.getNetworkSummary();
    const dir = path.dirname(filePath);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
  }

  /**
   * 清除所有记录的事件
   */
  clear(): void {
    this.networkRequests.clear();
    this.networkResponses.clear();
    this.consoleMessages = [];
  }

  /**
   * 关闭 CDP 会话
   */
  async close(): Promise<void> {
    if (this.cdpSession) {
      try {
        if (this.networkEnabled) {
          await this.cdpSession.send('Network.disable');
        }
        await this.cdpSession.detach();
      } catch (error) {
        // 忽略关闭时的错误
      }
      this.cdpSession = null;
      this.networkEnabled = false;
    }
  }
}

/**
 * 等待特定的网络请求
 * @param cdpManager CDP 会话管理器
 * @param urlPattern URL 模式
 * @param timeout 超时时间（毫秒）
 * @returns 匹配的请求-响应对
 */
export async function waitForNetworkRequest(
  cdpManager: CDPSessionManager,
  urlPattern: string | RegExp,
  timeout: number = 30_000
): Promise<Array<{ request: NetworkRequest; response?: NetworkResponse }>> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const pairs = cdpManager.getRequestResponsePairs(urlPattern);
    if (pairs.length > 0) {
      return pairs;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return [];
}
