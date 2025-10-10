import express from 'express';
import { getMapsApiService } from '@/services/mapsApiService';
import { 
  LogisticsRouteRequest, 
  DispatchMatrixRequest,
  MapsApiError 
} from '@/types/maps';

const router = express.Router();

// 地址解析端点
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        error: 'Address is required',
        code: 'MISSING_ADDRESS',
      });
    }

    const addressInfo = await getMapsApiService().geocodeAddress(address);
    
    res.json({
      success: true,
      data: addressInfo,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    handleMapsError(res, error as MapsApiError);
  }
});

// 反向地址解析端点
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES',
      });
    }

    const addressInfo = await getMapsApiService().reverseGeocode(lat, lng);
    
    res.json({
      success: true,
      data: addressInfo,
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    handleMapsError(res, error as MapsApiError);
  }
});

// 计算物流路线端点
router.post('/calculate-route', async (req, res) => {
  try {
    const routeRequest: LogisticsRouteRequest = req.body;
    
    // 验证请求数据
    const validationError = validateRouteRequest(routeRequest);
    if (validationError) {
      return res.status(400).json({
        error: validationError,
        code: 'INVALID_ROUTE_REQUEST',
      });
    }

    const routeResponse = await getMapsApiService().calculateLogisticsRoute(routeRequest);
    
    res.json({
      success: true,
      data: routeResponse,
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    handleMapsError(res, error as MapsApiError);
  }
});

// 计算调度矩阵端点
router.post('/dispatch-matrix', async (req, res) => {
  try {
    const matrixRequest: DispatchMatrixRequest = req.body;
    
    // 验证请求数据
    const validationError = validateMatrixRequest(matrixRequest);
    if (validationError) {
      return res.status(400).json({
        error: validationError,
        code: 'INVALID_MATRIX_REQUEST',
      });
    }

    // 限制矩阵大小以防止API滥用
    if (matrixRequest.drivers.length > 10 || matrixRequest.shipments.length > 25) {
      return res.status(400).json({
        error: 'Matrix size too large. Maximum 10 drivers and 25 shipments allowed.',
        code: 'MATRIX_SIZE_LIMIT_EXCEEDED',
      });
    }

    const matrixResponse = await getMapsApiService().calculateDispatchMatrix(matrixRequest);
    
    res.json({
      success: true,
      data: matrixResponse,
    });
  } catch (error) {
    console.error('Dispatch matrix error:', error);
    handleMapsError(res, error as MapsApiError);
  }
});

// 获取API使用统计
router.get('/usage-stats', (req, res) => {
  try {
    const stats = getMapsApiService().getUsageStats();
    
    res.json({
      success: true,
      data: {
        geocoding: stats.geocoding,
        directions: stats.directions,
        distanceMatrix: stats.distanceMatrix,
        places: stats.places,
        total: stats.geocoding + stats.directions + stats.distanceMatrix + stats.places,
      },
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve usage statistics',
      code: 'STATS_RETRIEVAL_ERROR',
    });
  }
});

// 清空缓存端点（仅开发环境）
router.delete('/cache', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Cache clearance is only allowed in development environment',
      code: 'CACHE_CLEARANCE_FORBIDDEN',
    });
  }

  try {
    getMapsApiService().clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Cache clearance error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      code: 'CACHE_CLEARANCE_ERROR',
    });
  }
});

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Maps API service is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 验证路由请求
function validateRouteRequest(request: LogisticsRouteRequest): string | null {
  if (!request.pickupAddress || !request.deliveryAddress) {
    return 'Pickup and delivery addresses are required';
  }

  if (!request.pickupAddress.latitude || !request.pickupAddress.longitude) {
    return 'Pickup address coordinates are required';
  }

  if (!request.deliveryAddress.latitude || !request.deliveryAddress.longitude) {
    return 'Delivery address coordinates are required';
  }

  if (!request.businessType) {
    return 'Business type is required';
  }

  if (!request.cargoInfo) {
    return 'Cargo information is required';
  }

  if (request.cargoInfo.weight < 0) {
    return 'Cargo weight must be non-negative';
  }

  if (request.cargoInfo.volume < 0) {
    return 'Cargo volume must be non-negative';
  }

  if (request.cargoInfo.pallets < 0) {
    return 'Number of pallets must be non-negative';
  }

  return null;
}

// 验证矩阵请求
function validateMatrixRequest(request: DispatchMatrixRequest): string | null {
  if (!request.drivers || request.drivers.length === 0) {
    return 'At least one driver is required';
  }

  if (!request.shipments || request.shipments.length === 0) {
    return 'At least one shipment is required';
  }

  for (const driver of request.drivers) {
    if (!driver.currentLocation || !driver.currentLocation.latitude || !driver.currentLocation.longitude) {
      return `Driver ${driver.id} location coordinates are required`;
    }
  }

  for (const shipment of request.shipments) {
    if (!shipment.pickupAddress || !shipment.pickupAddress.latitude || !shipment.pickupAddress.longitude) {
      return `Shipment ${shipment.id} pickup address coordinates are required`;
    }
  }

  return null;
}

// 处理地图API错误
function handleMapsError(res: express.Response, error: MapsApiError) {
  const statusCode = error.code >= 400 && error.code < 600 ? error.code : 500;
  
  res.status(statusCode).json({
    error: error.message,
    code: error.details || 'MAPS_API_ERROR',
    retryAfter: error.retryAfter,
  });
}

export default router;