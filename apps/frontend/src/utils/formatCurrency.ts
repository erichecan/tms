// 货币格式化工具函数
// 创建时间: 2025-01-27 15:36:00

/**
 * 安全地格式化货币数值，防止 toFixed 错误
 * @param value - 要格式化的值，可以是数字、字符串、null 或 undefined
 * @param precision - 小数位数，默认为 2
 * @param prefix - 货币符号前缀，默认为 '¥'
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  precision: number = 2,
  prefix: string = '¥'
): string => {
  try {
    // 处理 null 和 undefined
    if (value === null || value === undefined) {
      return `${prefix}0.${'0'.repeat(precision)}`;
    }

    let numValue: number;

    // 类型转换
    if (typeof value === 'string') {
      numValue = parseFloat(value);
    } else if (typeof value === 'number') {
      numValue = value;
    } else {
      console.warn('formatCurrency: Unexpected value type:', typeof value, value);
      return `${prefix}0.${'0'.repeat(precision)}`;
    }

    // 验证数值有效性
    if (isNaN(numValue) || !isFinite(numValue)) {
      console.warn('formatCurrency: Invalid numeric value:', value);
      return `${prefix}0.${'0'.repeat(precision)}`;
    }

    // 格式化数值
    return `${prefix}${numValue.toFixed(precision)}`;
  } catch (error) {
    console.error('formatCurrency: Error formatting value:', error, 'value:', value);
    return `${prefix}0.${'0'.repeat(precision)}`;
  }
};

/**
 * 格式化货币数值，带有千分位分隔符
 * @param value - 要格式化的值
 * @param precision - 小数位数，默认为 2
 * @param prefix - 货币符号前缀，默认为 '¥'
 * @returns 格式化后的货币字符串（带千分位分隔符）
 */
export const formatCurrencyWithSeparator = (
  value: number | string | null | undefined,
  precision: number = 2,
  prefix: string = '¥'
): string => {
  try {
    // 先使用基本格式化
    const basicFormatted = formatCurrency(value, precision, '');
    
    if (basicFormatted === `0.${'0'.repeat(precision)}`) {
      return `${prefix}${basicFormatted}`;
    }

    // 添加千分位分隔符
    const [integerPart, decimalPart] = basicFormatted.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${prefix}${formattedInteger}.${decimalPart}`;
  } catch (error) {
    console.error('formatCurrencyWithSeparator: Error:', error, 'value:', value);
    return formatCurrency(value, precision, prefix);
  }
};
