// ============================================================================
// 地址自动完成组件 - 二期开发功能
// 创建时间: 2025-10-10 16:30:00
// 更新时间: 2025-10-19 - 修复 setIsInitialized 错误
// 状态: 已注释，二期恢复
// 说明: 此组件包含Google Places API集成功能，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保API密钥配置正确
// 用途: 集成Google Places API实现地址自动完成和地理编码
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import type { InputRef } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import mapsService from '../../services/mapsService';
import { AddressInfo } from '../../types/maps';

interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: string, addressInfo?: AddressInfo) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddressSelected?: (addressInfo: AddressInfo) => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = '输入地址...',
  disabled = false,
  onAddressSelected,
}) => {
  const inputRef = useRef<InputRef>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        // 初始化地图服务
        await mapsService.initialize();

        if (!inputRef.current?.input) {
          return;
        }

        if (!mapsService.isReady() || !window.google?.maps?.places) {
          console.warn('⚠️ [AddressAutocomplete] Google Maps Places API 未就绪，自动完成功能将不可用');
          return;
        }

        // 创建自动完成实例
        const autocompleteInstance = new google.maps.places.Autocomplete(
          inputRef.current.input,
          {
            types: ['address'],
            componentRestrictions: { country: 'ca' },
            fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
          }
        );

        // 监听地址选择事件
        autocompleteInstance.addListener('place_changed', async () => {
          const place = autocompleteInstance.getPlace();

          if (!place.geometry || !place.geometry.location) {
            console.warn('无法获取该地址的位置信息');
            return;
          }

          const addressInfo: AddressInfo = {
            formattedAddress: place.formatted_address || '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            placeId: place.place_id || '',
          };

          // 解析地址组件
          if (place.address_components) {
            place.address_components.forEach(component => {
              if (component.types.includes('locality')) {
                addressInfo.city = component.long_name;
              } else if (component.types.includes('administrative_area_level_1')) {
                addressInfo.province = component.long_name;
              } else if (component.types.includes('postal_code')) {
                addressInfo.postalCode = component.long_name;
              } else if (component.types.includes('country')) {
                addressInfo.country = component.long_name;
              }
            });
          }

          // 触发回调
          onChange?.(place.formatted_address || '', addressInfo);
          onAddressSelected?.(addressInfo);
        });

        setAutocomplete(autocompleteInstance);
      } catch (error) {
        console.warn('⚠️ [AddressAutocomplete] 初始化地址自动完成跳过:', error);
      }
    };

    initAutocomplete();

    // 清理函数
    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []); // 2025-12-24 Fixed: Ensure initialization only runs once to prevent listener leaks and re-rendering loops.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
      allowClear
    />
  );
};

export default AddressAutocomplete;

