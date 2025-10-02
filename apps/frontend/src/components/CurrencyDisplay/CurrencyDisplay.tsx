// 币种显示组件
// 创建时间: 2025-09-26 16:40:00

import React from 'react';
import { Typography, Space, Tooltip } from 'antd';
// 临时常量定义
const CURRENCY_SYMBOLS = {
  CNY: '$',
  USD: '$',
  CAD: 'C$',
  EUR: '€'
} as const;

const CURRENCY_NAMES = {
  CNY: '人民币',
  USD: '美元',
  CAD: '加元',
  EUR: '欧元'
} as const;

const { Text } = Typography;

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  showSymbol?: boolean;
  showName?: boolean;
  precision?: number;
  locale?: string;
  style?: React.CSSProperties;
  tooltip?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  showSymbol = true,
  showName = false,
  precision = 2,
  locale = 'zh-CN',
  style,
  tooltip = false
}) => {
  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS];
  const name = CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES];
  
  const formatAmount = (amount: number, currency: string, locale: string, precision: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(amount);
    } catch (error) {
      // 如果Intl不支持该币种，使用简单格式
      const formattedAmount = amount.toFixed(precision);
      return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
    }
  };

  const displayText = formatAmount(amount, currency, locale, precision);
  
  const content = (
    <Space size="small" style={style}>
      <Text>{displayText}</Text>
      {showName && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          ({name})
        </Text>
      )}
    </Space>
  );

  if (tooltip) {
    return (
      <Tooltip title={`${amount.toFixed(precision)} ${currency} (${name})`}>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default CurrencyDisplay;
