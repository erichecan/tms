// 共享表单验证规则工具
// 创建时间：2025-11-30T11:45:00Z
// 用途：统一所有表单验证规则，确保数据一致性和用户体验一致性

import { Rule } from 'antd/es/form';

/**
 * 加拿大/美国手机号验证规则
 * 支持格式：
 * - 416-123-4567
 * - (416) 123-4567
 * - 4161234567
 * - +1 416-123-4567
 * - 1-416-123-4567
 */
export const phoneValidationRule: Rule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    
    // 去除所有非数字字符
    const digitsOnly = value.replace(/\D/g, '');
    
    // 加拿大/美国手机号：10位或11位数字
    // 11位：以1开头（国家代码）
    // 10位：直接是区号+号码
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // 11位：去掉国家代码后验证
      const areaCode = digitsOnly.substring(1, 4);
      const exchange = digitsOnly.substring(4, 7);
      const number = digitsOnly.substring(7, 11);
      
      // 区号不能以0或1开头，交换码不能以0或1开头
      if (/^[2-9]\d{2}$/.test(areaCode) && /^[2-9]\d{2}$/.test(exchange)) {
        return Promise.resolve();
      }
    } else if (digitsOnly.length === 10) {
      // 10位：直接验证
      const areaCode = digitsOnly.substring(0, 3);
      const exchange = digitsOnly.substring(3, 6);
      
      // 区号不能以0或1开头，交换码不能以0或1开头
      if (/^[2-9]\d{2}$/.test(areaCode) && /^[2-9]\d{2}$/.test(exchange)) {
        return Promise.resolve();
      }
    }
    
    return Promise.reject(new Error('请输入有效的加拿大/美国手机号（格式：416-123-4567 或 (416) 123-4567）'));
  }
};

/**
 * 邮箱验证规则（统一为必填）
 */
export const emailValidationRule: Rule[] = [
  { required: true, message: '请输入邮箱地址' },
  { type: 'email', message: '请输入有效的邮箱地址' }
];

/**
 * 邮箱验证规则（可选）
 */
export const emailOptionalValidationRule: Rule[] = [
  { type: 'email', message: '请输入有效的邮箱地址' }
];

/**
 * 加拿大邮政编码验证规则
 * 格式：A1A 1A1（字母-数字-字母 空格 数字-字母-数字）
 * 也兼容美国格式：12345 或 12345-6789
 */
export const postalCodeValidationRule: Rule = {
  validator: (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    
    const cleaned = value.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // 加拿大格式：A1A 1A1 或 A1A1A1
    const canadianPattern = /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/;
    
    // 美国格式：12345 或 12345-6789
    const usPattern = /^\d{5}(-\d{4})?$/;
    
    if (canadianPattern.test(cleaned) || usPattern.test(cleaned)) {
      return Promise.resolve();
    }
    
    return Promise.reject(new Error('请输入有效的邮政编码（加拿大格式：A1A 1A1 或 美国格式：12345）'));
  },
  transform: (value: string) => {
    // 统一转换为大写并格式化
    if (!value) return value;
    const cleaned = value.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // 如果是加拿大格式，添加空格
    if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
    }
    
    return cleaned;
  }
};

/**
 * 加拿大邮政编码验证规则（必填）
 */
export const postalCodeRequiredValidationRule: Rule[] = [
  { required: true, message: '请输入邮政编码' },
  postalCodeValidationRule
];

/**
 * 格式化手机号为统一格式
 * @param phone 原始手机号
 * @returns 格式化后的手机号（416-123-4567）
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return phone;
  
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // 去掉国家代码
    const areaCode = digitsOnly.substring(1, 4);
    const exchange = digitsOnly.substring(4, 7);
    const number = digitsOnly.substring(7, 11);
    return `${areaCode}-${exchange}-${number}`;
  } else if (digitsOnly.length === 10) {
    const areaCode = digitsOnly.substring(0, 3);
    const exchange = digitsOnly.substring(3, 6);
    const number = digitsOnly.substring(6, 10);
    return `${areaCode}-${exchange}-${number}`;
  }
  
  return phone;
};

/**
 * 提取手机号的纯数字（用于存储）
 * @param phone 格式化后的手机号
 * @returns 纯数字字符串
 */
export const extractPhoneDigits = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * 格式化邮政编码
 * @param postalCode 原始邮政编码
 * @returns 格式化后的邮政编码
 */
export const formatPostalCode = (postalCode: string): string => {
  if (!postalCode) return postalCode;
  
  const cleaned = postalCode.toUpperCase().replace(/\s+/g, '').trim();
  
  // 加拿大格式：A1A1A1 -> A1A 1A1
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  
  // 美国格式：保持原样或添加连字符
  if (/^\d{9}$/.test(cleaned)) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  
  return cleaned;
};

