// 到期提醒定时任务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 到期提醒定时任务

import cron from 'node-cron';
import { DatabaseService } from '../services/DatabaseService';
import { VehicleCertificateService } from '../services/VehicleCertificateService';
import { VehicleInsuranceService } from '../services/VehicleInsuranceService';
import { VehicleInspectionService } from '../services/VehicleInspectionService';
import { DriverCertificateService } from '../services/DriverCertificateService';
import { DriverMedicalService } from '../services/DriverMedicalService';
import { DriverTrainingService } from '../services/DriverTrainingService';
import { CarrierQuoteService } from '../services/CarrierQuoteService';
import { CarrierCertificateService } from '../services/CarrierCertificateService';
import { ExpiryNotificationService } from '../services/ExpiryNotificationService';
import { logger } from '../utils/logger';

export class ExpiryReminderJob {
  private dbService: DatabaseService;
  private certificateService: VehicleCertificateService;
  private insuranceService: VehicleInsuranceService;
  private inspectionService: VehicleInspectionService;
  private driverCertificateService: DriverCertificateService;
  private driverMedicalService: DriverMedicalService;
  private driverTrainingService: DriverTrainingService;
  private quoteService: CarrierQuoteService;
  private carrierCertificateService: CarrierCertificateService;
  private expiryNotificationService: ExpiryNotificationService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.dbService = new DatabaseService();
    this.certificateService = new VehicleCertificateService(this.dbService);
    this.insuranceService = new VehicleInsuranceService(this.dbService);
    this.inspectionService = new VehicleInspectionService(this.dbService);
    this.driverCertificateService = new DriverCertificateService(this.dbService);
    this.driverMedicalService = new DriverMedicalService(this.dbService);
    this.driverTrainingService = new DriverTrainingService(this.dbService);
    this.quoteService = new CarrierQuoteService(this.dbService);
    this.carrierCertificateService = new CarrierCertificateService(this.dbService);
    this.expiryNotificationService = new ExpiryNotificationService(this.dbService);
  }

  /**
   * 启动定时任务
   * 每天凌晨2点执行到期提醒检查
   */
  start(): void {
    // 每天凌晨2点执行
    this.task = cron.schedule('0 2 * * *', async () => {
      logger.info('开始执行到期提醒检查任务');
      try {
        await this.checkExpiringItems();
      } catch (error: any) {
        logger.error('到期提醒检查任务执行失败:', error);
      }
    });

    logger.info('到期提醒定时任务已启动（每天凌晨2点执行）');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('到期提醒定时任务已停止');
    }
  }

  /**
   * 检查所有即将到期的项目
   */
  private async checkExpiringItems(): Promise<void> {
    try {
      // 获取所有租户
      const tenants = await this.dbService.query('SELECT id FROM tenants WHERE status = $1', ['active']);

      for (const tenant of tenants) {
        const tenantId = tenant.id;
        const daysAhead = 30; // 提前30天提醒

        // 检查车辆证照
        const expiringCertificates = await this.certificateService.getExpiringCertificates(tenantId, daysAhead);
        if (expiringCertificates.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringCertificates.length} 个即将到期的车辆证照`);
          const notificationItems = expiringCertificates.map(cert => ({
            notificationType: 'vehicle_certificate' as const,
            entityType: 'vehicle',
            entityId: cert.vehicleId,
            entityName: (cert as any).plate_number || '未知车辆',
            itemName: `${this.getCertificateTypeName(cert.certificateType)} (${cert.certificateNumber})`,
            expiryDate: cert.expiryDate,
            daysUntilExpiry: this.calculateDaysUntilExpiry(cert.expiryDate)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查车辆保险
        const expiringInsurances = await this.insuranceService.getExpiringInsurances(tenantId, daysAhead);
        if (expiringInsurances.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringInsurances.length} 个即将到期的车辆保险`);
          const notificationItems = expiringInsurances.map(insurance => ({
            notificationType: 'vehicle_insurance' as const,
            entityType: 'vehicle',
            entityId: insurance.vehicleId,
            entityName: (insurance as any).plate_number || '未知车辆',
            itemName: `${this.getInsuranceTypeName(insurance.insuranceType)} (${insurance.policyNumber})`,
            expiryDate: insurance.expiryDate,
            daysUntilExpiry: this.calculateDaysUntilExpiry(insurance.expiryDate)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查车辆年检
        const expiringInspections = await this.inspectionService.getExpiringInspections(tenantId, daysAhead);
        if (expiringInspections.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringInspections.length} 个即将到期的车辆年检`);
          const notificationItems = expiringInspections.map(inspection => ({
            notificationType: 'vehicle_inspection' as const,
            entityType: 'vehicle',
            entityId: inspection.vehicleId,
            entityName: (inspection as any).plate_number || '未知车辆',
            itemName: `${this.getInspectionTypeName(inspection.inspectionType)} 年检`,
            expiryDate: inspection.expiryDate,
            daysUntilExpiry: this.calculateDaysUntilExpiry(inspection.expiryDate)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查司机证照
        const expiringDriverCertificates = await this.driverCertificateService.getExpiringCertificates(tenantId, daysAhead);
        if (expiringDriverCertificates.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringDriverCertificates.length} 个即将到期的司机证照`);
          const notificationItems = expiringDriverCertificates.map(cert => ({
            notificationType: 'driver_certificate' as const,
            entityType: 'driver',
            entityId: cert.driverId,
            entityName: (cert as any).driver_name || (cert as any).driver_phone || '未知司机',
            itemName: `${this.getCertificateTypeName(cert.certificateType)} (${cert.certificateNumber})`,
            expiryDate: cert.expiryDate,
            daysUntilExpiry: this.calculateDaysUntilExpiry(cert.expiryDate)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查司机体检
        const expiringMedicalRecords = await this.driverMedicalService.getExpiringMedicalRecords(tenantId, daysAhead);
        if (expiringMedicalRecords.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringMedicalRecords.length} 个即将到期的司机体检`);
          const notificationItems = expiringMedicalRecords.map(record => ({
            notificationType: 'driver_medical' as const,
            entityType: 'driver',
            entityId: record.driverId,
            entityName: (record as any).driver_name || (record as any).driver_phone || '未知司机',
            itemName: `${this.getExaminationTypeName(record.examinationType)} 体检`,
            expiryDate: record.expiryDate!,
            daysUntilExpiry: this.calculateDaysUntilExpiry(record.expiryDate!)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查司机培训证书
        const expiringTrainingCertificates = await this.driverTrainingService.getExpiringTrainingCertificates(tenantId, daysAhead);
        if (expiringTrainingCertificates.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringTrainingCertificates.length} 个即将到期的司机培训证书`);
          const notificationItems = expiringTrainingCertificates.map(record => ({
            notificationType: 'driver_training' as const,
            entityType: 'driver',
            entityId: record.driverId,
            entityName: (record as any).driver_name || (record as any).driver_phone || '未知司机',
            itemName: `${this.getTrainingTypeName(record.trainingType)} 培训证书`,
            expiryDate: record.expiryDate!,
            daysUntilExpiry: this.calculateDaysUntilExpiry(record.expiryDate!)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查承运商证照
        const expiringCarrierCertificates = await this.carrierCertificateService.getExpiringCertificates(tenantId, daysAhead);
        if (expiringCarrierCertificates.length > 0) {
          logger.warn(`租户 ${tenantId}: 发现 ${expiringCarrierCertificates.length} 个即将到期的承运商证照`);
          const notificationItems = expiringCarrierCertificates.map(cert => ({
            notificationType: 'carrier_certificate' as const,
            entityType: 'carrier',
            entityId: cert.carrierId,
            entityName: (cert as any).carrier_name || '未知承运商',
            itemName: `${this.getCertificateTypeName(cert.certificateType)} (${cert.certificateNumber})`,
            expiryDate: cert.expiryDate,
            daysUntilExpiry: this.calculateDaysUntilExpiry(cert.expiryDate)
          }));
          await this.expiryNotificationService.createBatchExpiryNotifications(tenantId, notificationItems);
        }

        // 检查并更新过期报价
        const expiredQuotes = await this.quoteService.checkAndExpireQuotes(tenantId);
        if (expiredQuotes > 0) {
          logger.info(`租户 ${tenantId}: 已更新 ${expiredQuotes} 个过期报价`);
        }
      }

      logger.info('到期提醒检查任务执行完成');
    } catch (error: any) {
      logger.error('检查到期项目时出错:', error);
      throw error;
    }
  }

  /**
   * 计算距离到期还有多少天
   */
  private calculateDaysUntilExpiry(expiryDate: Date | string): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * 获取证照类型名称
   */
  private getCertificateTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'driving_license': '行驶证',
      'operation_permit': '营运证',
      'etc': 'ETC',
      'hazardous_permit': '危化许可',
      'professional_qualification': '从业资格',
      'hazardous_license': '危化驾照',
      'business_license': '营业执照',
      'transport_permit': '运输许可证',
      'cold_chain': '冷链资质',
      'insurance': '保险',
      'other': '其他'
    };
    return typeMap[type] || type;
  }

  /**
   * 获取保险类型名称
   */
  private getInsuranceTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'liability': '责任险',
      'comprehensive': '全险',
      'collision': '碰撞险',
      'cargo': '货物险',
      'third_party': '第三方险',
      'other': '其他'
    };
    return typeMap[type] || type;
  }

  /**
   * 获取年检类型名称
   */
  private getInspectionTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'annual': '年度',
      'safety': '安全',
      'emission': '排放',
      'roadworthiness': '道路适应性',
      'other': '其他'
    };
    return typeMap[type] || type;
  }

  /**
   * 获取体检类型名称
   */
  private getExaminationTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'annual': '年度',
      'pre_employment': '入职',
      'periodic': '定期',
      'special': '特殊',
      'other': '其他'
    };
    return typeMap[type] || type;
  }

  /**
   * 获取培训类型名称
   */
  private getTrainingTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'safety': '安全',
      'regulation': '法规',
      'skill': '技能',
      'certification': '认证',
      'other': '其他'
    };
    return typeMap[type] || type;
  }
}

