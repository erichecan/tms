// 测试数据生成脚本
// 创建时间: 2025-09-30 10:45:00
// 作用: 生成完整的测试数据，包含各种状态和时间

import { DatabaseService } from '../services/DatabaseService';
import dayjs from 'dayjs';

interface TestCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: 'standard' | 'premium' | 'vip';
  contactInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  billingInfo: {
    companyName: string;
    taxId: string;
    billingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface TestDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  licenseNumber: string;
  licenseExpiry: string;
  vehicleId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TestVehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacityKg: number;
  status: 'available' | 'busy' | 'maintenance';
  year: number;
  make: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface TestShipment {
  id: string;
  shipmentNumber: string;
  customerId: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  shipperAddress: {
    country: string;
    province: string;
    city: string;
    postalCode: string;
    addressLine1: string;
    isResidential: boolean;
  };
  receiverAddress: {
    country: string;
    province: string;
    city: string;
    postalCode: string;
    addressLine1: string;
    isResidential: boolean;
  };
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  description: string;
  estimatedCost: number;
  finalCost?: number;
  createdAt: string;
  updatedAt: string;
}

interface TestTrip {
  id: string;
  tripNo: string;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  driverId: string;
  vehicleId: string;
  shipments: string[];
  startTimePlanned: string;
  endTimePlanned: string;
  startTimeActual?: string;
  endTimeActual?: string;
  createdAt: string;
  updatedAt: string;
}

export class TestDataGenerator {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  // 生成测试客户数据
  generateCustomers(): TestCustomer[] {
    const customers: TestCustomer[] = [];
    const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市', '西安市', '重庆市'];
    const levels: ('standard' | 'premium' | 'vip')[] = ['standard', 'premium', 'vip'];

    for (let i = 1; i <= 8; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      
      customers.push({
        id: `customer_${i}`,
        name: `客户${i}`,
        email: `customer${i}@example.com`,
        phone: `138${String(i).padStart(8, '0')}`,
        level,
        contactInfo: {
          address: {
            street: `${city}${i}号大街${i}号`,
            city,
            state: city.substring(0, 2),
            postalCode: `${100000 + i}`,
            country: '中国'
          }
        },
        billingInfo: {
          companyName: `${city}贸易公司${i}`,
          taxId: `TAX${String(i).padStart(6, '0')}`,
          billingAddress: {
            street: `${city}${i}号大街${i}号`,
            city,
            state: city.substring(0, 2),
            postalCode: `${100000 + i}`,
            country: '中国'
          }
        },
        createdAt: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toISOString(),
        updatedAt: dayjs().subtract(Math.floor(Math.random() * 7), 'day').toISOString()
      });
    }

    return customers;
  }

  // 生成测试司机数据 - 增加更多司机数据用于测试 // 2025-10-01 21:30:00
  generateDrivers(): TestDriver[] {
    const drivers: TestDriver[] = [];
    const statuses: ('available' | 'busy' | 'offline')[] = ['available', 'busy', 'offline'];
    const names = ['李司机', '王司机', '张司机', '刘司机', '陈司机', '杨司机', '赵司机', '黄司机', '周司机', '吴司机', '徐司机', '孙司机', '马司机', '朱司机', '胡司机'];

    for (let i = 1; i <= 15; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const name = names[i - 1] || `司机${i}`;
      
      drivers.push({
        id: `driver_${i}`,
        name,
        phone: `139${String(i).padStart(8, '0')}`,
        email: `driver${i}@example.com`,
        status,
        licenseNumber: `A${String(i).padStart(10, '0')}`,
        licenseExpiry: dayjs().add(Math.floor(Math.random() * 365) + 30, 'day').format('YYYY-MM-DD'),
        createdAt: dayjs().subtract(Math.floor(Math.random() * 60), 'day').toISOString(),
        updatedAt: dayjs().subtract(Math.floor(Math.random() * 7), 'day').toISOString()
      });
    }

    return drivers;
  }

  // 生成测试车辆数据 - 增加更多车辆数据用于测试 // 2025-10-01 21:30:00
  generateVehicles(): TestVehicle[] {
    const vehicles: TestVehicle[] = [];
    const types = ['厢式货车', '平板车', '冷藏车', '危险品运输车', '普通货车', '集装箱车'];
    const makes = ['东风', '解放', '重汽', '陕汽', '福田', '江淮', '江铃', '庆铃'];
    const models = ['天龙', 'J6', '豪沃', '德龙', '欧曼', '格尔发', '凯运', '600P'];
    const statuses: ('available' | 'busy' | 'maintenance')[] = ['available', 'busy', 'maintenance'];
    const platePrefixes = ['京', '沪', '粤', '深', '杭', '宁', '蓉', '汉', '西', '渝'];

    for (let i = 1; i <= 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const make = makes[Math.floor(Math.random() * makes.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const platePrefix = platePrefixes[Math.floor(Math.random() * platePrefixes.length)];
      
      vehicles.push({
        id: `vehicle_${i}`,
        plateNumber: `${platePrefix}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(i).padStart(5, '0')}`,
        type,
        capacityKg: Math.floor(Math.random() * 15000) + 1000,
        status,
        year: 2018 + Math.floor(Math.random() * 6),
        make,
        model,
        createdAt: dayjs().subtract(Math.floor(Math.random() * 60), 'day').toISOString(),
        updatedAt: dayjs().subtract(Math.floor(Math.random() * 7), 'day').toISOString()
      });
    }

    return vehicles;
  }

  // 生成测试运单数据
  generateShipments(customers: TestCustomer[]): TestShipment[] {
    const shipments: TestShipment[] = [];
    const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市', '西安市', '重庆市'];
    const descriptions = ['电子产品', '服装', '食品', '家具', '建材', '化工产品', '机械零件', '图书', '日用品', '医疗器械'];
    const statuses: TestShipment['status'][] = ['pending', 'quoted', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'];

    for (let i = 1; i <= 20; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const shipperCity = cities[Math.floor(Math.random() * cities.length)];
      const receiverCity = cities[Math.floor(Math.random() * cities.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      // 根据状态确定创建时间
      let createdAt: string;
      if (status === 'completed' || status === 'delivered') {
        createdAt = dayjs().subtract(Math.floor(Math.random() * 30) + 1, 'day').toISOString();
      } else if (status === 'in_transit' || status === 'picked_up') {
        createdAt = dayjs().subtract(Math.floor(Math.random() * 7) + 1, 'day').toISOString();
      } else if (status === 'assigned' || status === 'confirmed') {
        createdAt = dayjs().subtract(Math.floor(Math.random() * 3), 'day').toISOString();
      } else {
        createdAt = dayjs().subtract(Math.floor(Math.random() * 2), 'day').toISOString();
      }

      shipments.push({
        id: `shipment_${i}`,
        shipmentNumber: `SHIP-${dayjs(createdAt).format('YYYYMMDD')}-${String(i).padStart(3, '0')}`,
        customerId: customer.id,
        status,
        shipperAddress: {
          country: '中国',
          province: shipperCity.substring(0, 2),
          city: shipperCity,
          postalCode: `${100000 + i}`,
          addressLine1: `${shipperCity}发货地址${i}号`,
          isResidential: Math.random() > 0.5
        },
        receiverAddress: {
          country: '中国',
          province: receiverCity.substring(0, 2),
          city: receiverCity,
          postalCode: `${200000 + i}`,
          addressLine1: `${receiverCity}收货地址${i}号`,
          isResidential: Math.random() > 0.5
        },
        weightKg: Math.floor(Math.random() * 1000) + 10,
        lengthCm: Math.floor(Math.random() * 200) + 50,
        widthCm: Math.floor(Math.random() * 150) + 30,
        heightCm: Math.floor(Math.random() * 100) + 20,
        description,
        estimatedCost: Math.floor(Math.random() * 2000) + 100,
        finalCost: status === 'completed' ? Math.floor(Math.random() * 2000) + 100 : undefined,
        createdAt,
        updatedAt: dayjs().subtract(Math.floor(Math.random() * 2), 'day').toISOString()
      });
    }

    return shipments;
  }

  // 生成测试行程数据
  generateTrips(drivers: TestDriver[], vehicles: TestVehicle[], shipments: TestShipment[]): TestTrip[] {
    const trips: TestTrip[] = [];
    const statuses: TestTrip['status'][] = ['planning', 'ongoing', 'completed', 'cancelled'];

    for (let i = 1; i <= 8; i++) {
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // 为行程分配运单
      const tripShipments = shipments
        .filter(s => s.status === 'assigned' || s.status === 'picked_up' || s.status === 'in_transit')
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map(s => s.id);

      let startTimePlanned: string;
      let endTimePlanned: string;
      let startTimeActual: string | undefined;
      let endTimeActual: string | undefined;

      if (status === 'completed') {
        startTimePlanned = dayjs().subtract(Math.floor(Math.random() * 7) + 1, 'day').format('YYYY-MM-DDTHH:mm:ssZ');
        endTimePlanned = dayjs(startTimePlanned).add(Math.floor(Math.random() * 8) + 2, 'hour').toISOString();
        startTimeActual = dayjs(startTimePlanned).add(Math.floor(Math.random() * 30), 'minute').toISOString();
        endTimeActual = dayjs(endTimePlanned).add(Math.floor(Math.random() * 60), 'minute').toISOString();
      } else if (status === 'ongoing') {
        startTimePlanned = dayjs().subtract(Math.floor(Math.random() * 2), 'day').format('YYYY-MM-DDTHH:mm:ssZ');
        endTimePlanned = dayjs(startTimePlanned).add(Math.floor(Math.random() * 8) + 2, 'hour').toISOString();
        startTimeActual = dayjs(startTimePlanned).add(Math.floor(Math.random() * 30), 'minute').toISOString();
      } else if (status === 'planning') {
        startTimePlanned = dayjs().add(Math.floor(Math.random() * 3) + 1, 'day').format('YYYY-MM-DDTHH:mm:ssZ');
        endTimePlanned = dayjs(startTimePlanned).add(Math.floor(Math.random() * 8) + 2, 'hour').toISOString();
      } else {
        startTimePlanned = dayjs().subtract(Math.floor(Math.random() * 5) + 1, 'day').format('YYYY-MM-DDTHH:mm:ssZ');
        endTimePlanned = dayjs(startTimePlanned).add(Math.floor(Math.random() * 8) + 2, 'hour').toISOString();
      }

      trips.push({
        id: `trip_${i}`,
        tripNo: `TRIP-${dayjs(startTimePlanned).format('YYYYMMDD')}-${String(i).padStart(3, '0')}`,
        status,
        driverId: driver.id,
        vehicleId: vehicle.id,
        shipments: tripShipments,
        startTimePlanned,
        endTimePlanned,
        startTimeActual,
        endTimeActual,
        createdAt: dayjs(startTimePlanned).subtract(1, 'day').toISOString(),
        updatedAt: dayjs().subtract(Math.floor(Math.random() * 2), 'day').toISOString()
      });
    }

    return trips;
  }

  // 生成所有测试数据并插入数据库 // 2025-10-01 21:30:00
  async generateAllTestData(): Promise<void> {
    try {
      console.log('开始生成测试数据...');

      // 生成基础数据
      const customers = this.generateCustomers();
      const drivers = this.generateDrivers();
      const vehicles = this.generateVehicles();
      const shipments = this.generateShipments(customers);
      const trips = this.generateTrips(drivers, vehicles, shipments);

      console.log(`生成完成:`);
      console.log(`- 客户: ${customers.length} 条`);
      console.log(`- 司机: ${drivers.length} 条`);
      console.log(`- 车辆: ${vehicles.length} 条`);
      console.log(`- 运单: ${shipments.length} 条`);
      console.log(`- 行程: ${trips.length} 条`);

      // 插入数据库
      console.log('\n开始插入数据库...');
      const tenantId = '00000000-0000-0000-0000-000000000001';

      // 插入司机数据 - 修复字段匹配问题 // 2025-10-01 21:35:00
      for (const driver of drivers) {
        try {
          await this.dbService.createDriver(tenantId, {
            name: driver.name,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            status: driver.status === 'available' ? 'active' : 'inactive',
            vehicleInfo: {
              type: 'truck',
              capacity: 10000,
              features: ['GPS'],
              dimensions: { width: 2.5, height: 2.8, length: 6 },
              licensePlate: `京A${driver.id.slice(-4)}`
            },
            performance: {
              rating: 4.5 + Math.random() * 0.5,
              onTimeRate: 0.9 + Math.random() * 0.1,
              totalDeliveries: Math.floor(Math.random() * 200) + 50,
              customerSatisfaction: 0.85 + Math.random() * 0.15
            }
          });
          console.log(`✓ 司机 ${driver.name} 插入成功`);
        } catch (error) {
          console.log(`⚠ 司机 ${driver.name} 插入失败:`, error.message);
        }
      }

      // 插入车辆数据 - 修复字段匹配问题 // 2025-10-01 21:35:00
      for (const vehicle of vehicles) {
        try {
          await this.dbService.createVehicle({
            plateNumber: vehicle.plateNumber,
            vehicleType: vehicle.type,
            capacity: vehicle.capacityKg,
            status: vehicle.status
          });
          console.log(`✓ 车辆 ${vehicle.plateNumber} 插入成功`);
        } catch (error) {
          console.log(`⚠ 车辆 ${vehicle.plateNumber} 插入失败:`, error.message);
        }
      }

      console.log('\n测试数据插入完成！');
    } catch (error) {
      console.error('生成测试数据失败:', error);
      throw error;
    }
  }
}

// 如果直接运行此文件，则生成测试数据
if (require.main === module) {
  const generator = new TestDataGenerator();
  generator.generateAllTestData()
    .then(() => {
      console.log('测试数据生成完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试数据生成失败:', error);
      process.exit(1);
    });
}

export default TestDataGenerator;
