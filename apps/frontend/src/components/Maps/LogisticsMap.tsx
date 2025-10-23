// ============================================================================
// 物流地图组件 - 二期开发功能
// 创建时间: 2025-10-10
// 状态: 已注释，二期恢复
// 说明: 此组件包含Google Maps API集成功能，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保API密钥配置正确
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Card, Spin, Alert } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import mapsService, { MapsService } from '@/services/mapsService';
import { LogisticsRoute, AddressInfo } from '@/types/maps';
import './LogisticsMap.css';

interface LogisticsMapProps {
  pickupAddress?: AddressInfo;
  deliveryAddress?: AddressInfo;
  routeData?: LogisticsRoute;
  showRoute?: boolean;
  showMarkers?: boolean;
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (address: AddressInfo) => void;
}

const LogisticsMap: React.FC<LogisticsMapProps> = ({
  pickupAddress,
  deliveryAddress,
  routeData,
  showRoute = true,
  showMarkers = true,
  height = '400px',
  onMapClick,
  onMarkerClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maps, setMaps] = useState<typeof google.maps | null>(null);

  // 初始化地图
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await mapsService.initialize();
        const googleMaps = mapsService.getMaps();
        setMaps(googleMaps);

        if (mapRef.current) {
          mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
            center: { lat: 43.6532, lng: -79.3832 }, // 多伦多
            zoom: 10,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          // 初始化路线渲染器
          directionsRendererRef.current = new googleMaps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true, // 使用自定义标记
            polylineOptions: {
              strokeColor: '#1890ff',
              strokeOpacity: 0.8,
              strokeWeight: 5,
            },
          });

          // 添加地图点击事件
          if (onMapClick) {
            mapInstanceRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                onMapClick(event.latLng.lat(), event.latLng.lng());
              }
            });
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize map:', err);
        setError('地图初始化失败，请检查网络连接和API密钥配置');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [onMapClick]);

  // 清除标记和路线
  const clearMap = () => {
    // 清除标记
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 清除路线
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  };

  // 添加标记
  const addMarker = (position: { lat: number; lng: number }, title: string, color: string = '#ff4d4f') => {
    if (!mapInstanceRef.current || !maps) return null;

    const marker = new maps.Marker({
      position,
      map: mapInstanceRef.current,
      title,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    if (onMarkerClick) {
      marker.addListener('click', () => {
        mapsService.reverseGeocode(position.lat, position.lng)
          .then(address => onMarkerClick(address))
          .catch(console.error);
      });
    }

    markersRef.current.push(marker);
    return marker;
  };

  // 渲染路线
  const renderRoute = async () => {
    if (!mapInstanceRef.current || !maps || !routeData || !showRoute) return;

    clearMap();

    try {
      const directionsService = new maps.DirectionsService();
      
      const request = {
        origin: { 
          lat: routeData.pickupAddress.latitude, 
          lng: routeData.pickupAddress.longitude 
        },
        destination: { 
          lat: routeData.deliveryAddress.latitude, 
          lng: routeData.deliveryAddress.longitude 
        },
        travelMode: maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: maps.TrafficModel.BEST_GUESS,
        },
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result && directionsRendererRef.current) {
          directionsRendererRef.current.setMap(mapInstanceRef.current);
          directionsRendererRef.current.setDirections(result);

          // 调整地图视野以显示整个路线
          const bounds = new maps.LatLngBounds();
          result.routes[0].legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapInstanceRef.current?.fitBounds(bounds);
        }
      });

    } catch (err) {
      console.error('Failed to render route:', err);
    }
  };

  // 渲染标记点
  const renderMarkers = () => {
    if (!mapInstanceRef.current || !showMarkers) return;

    clearMap();

    // 添加取货点标记
    if (pickupAddress) {
      addMarker(
        { lat: pickupAddress.latitude, lng: pickupAddress.longitude },
        '取货点',
        '#52c41a' // 绿色
      );
    }

    // 添加送货点标记
    if (deliveryAddress) {
      addMarker(
        { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude },
        '送货点',
        '#ff4d4f' // 红色
      );
    }

    // 如果有路线数据，添加路径上的标记点
    if (routeData?.optimalRoute.segments) {
      routeData.optimalRoute.segments.forEach((segment, index) => {
        if (index > 0 && index < routeData.optimalRoute.segments.length - 1) {
          addMarker(
            { lat: segment.startAddress.latitude, lng: segment.startAddress.longitude },
            `路径点 ${index}`,
            '#1890ff' // 蓝色
          );
        }
      });
    }

    // 调整地图视野以显示所有标记
    if (markersRef.current.length > 0 && mapInstanceRef.current) {
      const bounds = new maps!.LatLngBounds();
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  // 当地址或路线数据变化时更新地图
  useEffect(() => {
    if (!mapInstanceRef.current || !maps) return;

    if (routeData) {
      renderRoute();
    } else {
      renderMarkers();
    }
  }, [pickupAddress, deliveryAddress, routeData, maps, showRoute, showMarkers]);

  return (
    <Card 
      title="🗺️ 物流路径地图" 
      className="logistics-map-card"
      bodyStyle={{ padding: 0 }}
    >
      <div className="map-container" style={{ height }}>
        {isLoading && (
          <div className="map-loading">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <span style={{ marginLeft: 8 }}>地图加载中...</span>
          </div>
        )}
        
        {error && (
          <Alert
            message="地图加载错误"
            description={error}
            type="error"
            showIcon
            style={{ margin: 16 }}
          />
        )}
        
        <div 
          ref={mapRef} 
          className="map-element"
          style={{ 
            height: '100%', 
            width: '100%',
            display: isLoading ? 'none' : 'block' 
          }}
        />
      </div>
      
      {/* 路线信息面板 */}
      {routeData && !isLoading && !error && (
        <div className="route-info-panel">
          <div className="route-summary">
            <div className="route-item">
              <span className="label">总距离:</span>
              <span className="value">{routeData.optimalRoute.distance.toFixed(1)} km</span>
            </div>
            <div className="route-item">
              <span className="label">预计时间:</span>
              <span className="value">{Math.ceil(routeData.optimalRoute.duration)} 分钟</span>
            </div>
            <div className="route-item">
              <span className="label">燃油成本:</span>
              <span className="value">CAD ${routeData.optimalRoute.fuelCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LogisticsMap;