// 地址自动完成组件
// 创建时间: 2025-10-10 16:30:00
// 用途: 集成Google Places API实现地址自动完成和地理编码

import React, { useEffect, useRef, useState } from 'react';
import { Input, message } from 'antd';
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
  const inputRef = useRef<any>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        // 初始化地图服务
        await mapsService.initialize();
        
        if (!inputRef.current?.input) {
          console.warn('输入框未就绪');
          return;
        }

        const maps = mapsService.getMaps();
        
        // 创建自动完成实例 // 2025-10-17T20:30:00 修复 Autocomplete 构造函数
        const autocompleteInstance = new google.maps.places.Autocomplete(
          inputRef.current.input,
          {
            types: ['address'],
            componentRestrictions: { country: 'ca' }, // 限制为加拿大
            fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
          }
        );

        // 监听地址选择事件
        autocompleteInstance.addListener('place_changed', async () => {
          const place = autocompleteInstance.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            message.warning('无法获取该地址的位置信息');
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
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化地址自动完成失败:', error);
        message.error('地图服务初始化失败，请刷新页面重试');
      }
    };

    initAutocomplete();

    // 清理函数
    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

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

