// 币种选择器组件
// 创建时间: 2025-09-26 16:40:00

import React from 'react';
import { Select, Space, Typography } from 'antd';
// 临时常量定义
const SUPPORTED_CURRENCIES = ['CNY', 'USD', 'CAD', 'EUR'] as const;

const CURRENCY_SYMBOLS = {
  CNY: '¥',
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
const { Option } = Select;

interface CurrencySelectorProps {
  value?: string;
  onChange?: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showSymbol?: boolean;
  showName?: boolean;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  placeholder = '选择币种',
  disabled = false,
  showSymbol = true,
  showName = true,
  size = 'middle',
  style
}) => {
  const renderOption = (currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS];
    const name = CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES];
    
    return (
      <Space>
        {showSymbol && <Text strong>{symbol}</Text>}
        <Text>{currency}</Text>
        {showName && <Text type="secondary">({name})</Text>}
      </Space>
    );
  };

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      size={size}
      style={style}
      optionFilterProp="children"
      showSearch
      filterOption={(input, option) => {
        const children = option?.children;
        if (typeof children === 'string') {
          return children.toLowerCase().includes(input.toLowerCase());
        }
        return false;
      }}
    >
      {SUPPORTED_CURRENCIES.map((currency: string) => (
        <Option key={currency} value={currency}>
          {renderOption(currency)}
        </Option>
      ))}
    </Select>
  );
};

export default CurrencySelector;
