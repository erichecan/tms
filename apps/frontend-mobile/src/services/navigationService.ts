// 2025-11-30T11:40:00Z Created by Assistant: 导航服务
export interface Address {
  latitude?: number;
  longitude?: number;
  addressLine1?: string;
  city?: string;
  province?: string;
}

/**
 * 检测设备类型
 */
function detectDevice(): 'ios' | 'android' | 'unknown' {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'unknown';
}

/**
 * 打开导航到指定地址
 */
export function navigateToAddress(address: Address): void {
  if (!address.latitude || !address.longitude) {
    throw new Error('地址坐标未提供，无法导航');
  }

  const device = detectDevice();
  const lat = address.latitude;
  const lng = address.longitude;
  const addressName = address.addressLine1 || `${address.city || ''} ${address.province || ''}`.trim() || '目的地';

  let url: string;

  if (device === 'ios') {
    // iOS 使用 Apple Maps
    url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    
    // 如果 Apple Maps 不可用，尝试使用 Google Maps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    // 尝试打开 Apple Maps，如果失败则打开 Google Maps
    window.location.href = url;
    
    // 如果3秒后还在当前页面，说明 Apple Maps 不可用，打开 Google Maps
    setTimeout(() => {
      window.open(googleMapsUrl, '_blank');
    }, 3000);
  } else if (device === 'android') {
    // Android 使用 Google Maps
    url = `google.navigation:q=${lat},${lng}`;
    
    // 如果 Google Maps 应用不可用，使用网页版
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    // 尝试打开 Google Maps 应用
    window.location.href = url;
    
    // 如果3秒后还在当前页面，说明应用不可用，打开网页版
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 3000);
  } else {
    // 其他设备使用通用的 geo: URI scheme
    url = `geo:${lat},${lng}?q=${encodeURIComponent(addressName)}`;
    window.location.href = url;
    
    // 备用方案：使用 Google Maps 网页版
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 2000);
  }
}

/**
 * 打开拨打电话
 */
export function makePhoneCall(phone: string): void {
  if (!phone) {
    throw new Error('电话号码未提供');
  }

  // 移除电话号码中的非数字字符（保留+号）
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  
  if (!cleanedPhone) {
    throw new Error('无效的电话号码');
  }

  window.location.href = `tel:${cleanedPhone}`;
}

/**
 * 格式化地址用于显示
 */
export function formatAddress(address?: Address): string {
  if (!address) return '未提供';
  
  const parts = [
    address.province,
    address.city,
    address.addressLine1,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(' ') : '未提供';
}

