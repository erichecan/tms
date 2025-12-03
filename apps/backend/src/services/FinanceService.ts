// 财务服务
// 创建时间: 2025-01-27 15:30:45

import { DatabaseService } from './DatabaseService';
import { RuleEngineService } from './RuleEngineService';
import { CurrencyService } from './CurrencyService';
import { logger } from '../utils/logger';
import { DEFAULT_CURRENCY } from '@tms/shared-types';
import { 
  FinancialRecord, 
  Statement, 
  StatementItem, 
  StatementType, 
  StatementStatus,
  FinancialType,
  FinancialStatus,
  Shipment,
  Driver,
  Customer,
  QueryParams,
  PaginatedResponse
} from '@tms/shared-types';

export interface ReceivableSummary {
  customerId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  shipmentCount: number;
  lastPaymentDate?: Date;
}

export interface PayableSummary {
  driverId: string;
  driverName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  shipmentCount: number;
  lastPaymentDate?: Date;
}

export interface FinancialReport {
  period: {
    start: Date;
    end: Date;
  };
  revenue: {
    total: number;
    byMonth: Record<string, number>;
    byCustomer: Record<string, number>;
  };
  expenses: {
    total: number;
    driverPayroll: number;
    operational: number;
  };
  profit: number;
  profitMargin: number;
}

export class FinanceService {
  private dbService: DatabaseService;
  private ruleEngineService: RuleEngineService;
  private currencyService: CurrencyService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService, currencyService: CurrencyService) {
    this.dbService = dbService;
    this.ruleEngineService = ruleEngineService;
    this.currencyService = currencyService;
  }

  /**
   * 获取应收账款汇总
   * @param tenantId 租户ID
   * @param customerId 客户ID（可选）
   * @returns 应收账款汇总
   */
  async getReceivablesSummary(tenantId: string, customerId?: string): Promise<ReceivableSummary[]> {
    try {
      const query = `
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          COUNT(s.id) as shipment_count,
          SUM(COALESCE(s.actual_cost, s.estimated_cost)) as total_amount,
          SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN fr.status = 'pending' THEN fr.amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN fr.status = 'overdue' THEN fr.amount ELSE 0 END) as overdue_amount,
          MAX(fr.paid_at) as last_payment_date
        FROM customers c
        LEFT JOIN shipments s ON c.id = s.customer_id AND s.status = 'completed'
        LEFT JOIN financial_records fr ON c.id = fr.reference_id AND fr.type = 'receivable'
        WHERE c.tenant_id = $1
        ${customerId ? 'AND c.id = $2' : ''}
        GROUP BY c.id, c.name
        HAVING COUNT(s.id) > 0
        ORDER BY total_amount DESC
      `;

      const params = customerId ? [tenantId, customerId] : [tenantId];
      const result = await this.dbService.query(query, params);

      return result.map(row => ({
        customerId: row.customer_id,
        customerName: row.customer_name,
        totalAmount: parseFloat(row.total_amount) || 0,
        paidAmount: parseFloat(row.paid_amount) || 0,
        pendingAmount: parseFloat(row.pending_amount) || 0,
        overdueAmount: parseFloat(row.overdue_amount) || 0,
        shipmentCount: parseInt(row.shipment_count) || 0,
        lastPaymentDate: row.last_payment_date
      }));
    } catch (error) {
      logger.error('Failed to get receivables summary:', error);
      throw error;
    }
  }

  /**
   * 获取应付账款汇总
   * @param tenantId 租户ID
   * @param driverId 司机ID（可选）
   * @returns 应付账款汇总
   */
  async getPayablesSummary(tenantId: string, driverId?: string): Promise<PayableSummary[]> {
    try {
      const query = `
        SELECT 
          d.id as driver_id,
          d.name as driver_name,
          COUNT(s.id) as shipment_count,
          SUM(COALESCE(s.actual_cost, s.estimated_cost)) as total_amount,
          SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN fr.status = 'pending' THEN fr.amount ELSE 0 END) as pending_amount,
          MAX(fr.paid_at) as last_payment_date
        FROM drivers d
        LEFT JOIN shipments s ON d.id = s.driver_id AND s.status = 'completed'
        LEFT JOIN financial_records fr ON d.id = fr.reference_id AND fr.type = 'payable'
        WHERE d.tenant_id = $1
        ${driverId ? 'AND d.id = $2' : ''}
        GROUP BY d.id, d.name
        HAVING COUNT(s.id) > 0
        ORDER BY total_amount DESC
      `;

      const params = driverId ? [tenantId, driverId] : [tenantId];
      const result = await this.dbService.query(query, params);

      return result.map(row => ({
        driverId: row.driver_id,
        driverName: row.driver_name,
        totalAmount: parseFloat(row.total_amount) || 0,
        paidAmount: parseFloat(row.paid_amount) || 0,
        pendingAmount: parseFloat(row.pending_amount) || 0,
        shipmentCount: parseInt(row.shipment_count) || 0,
        lastPaymentDate: row.last_payment_date
      }));
    } catch (error) {
      logger.error('Failed to get payables summary:', error);
      throw error;
    }
  }

  /**
   * 生成客户对账单
   * @param tenantId 租户ID
   * @param customerId 客户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param generatedBy 生成人
   * @returns 生成的对账单
   */
  async generateCustomerStatement(
    tenantId: string, 
    customerId: string, 
    startDate: Date, 
    endDate: Date, 
    generatedBy: string
  ): Promise<Statement> {
    try {
      // 获取客户信息
      const customer = await this.dbService.getCustomer(tenantId, customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // 获取该客户在指定期间的已完成运单
      const shipments = await this.dbService.getShipments(tenantId, {
        filters: { customerId, startDate, endDate, status: 'completed' }
      });

      if (!shipments.data || shipments.data.length === 0) {
        throw new Error('No completed shipments found for the specified period');
      }

      // 构建对账单项目
      const items: StatementItem[] = shipments.data.map(shipment => {
        const completedDate = shipment.timeline?.completed 
          ? (typeof shipment.timeline.completed === 'string' ? new Date(shipment.timeline.completed) : shipment.timeline.completed)
          : (typeof shipment.createdAt === 'string' ? new Date(shipment.createdAt) : shipment.createdAt);
        
        return {
          id: shipment.id,
          description: `运单 ${shipment.shipmentNumber} - ${shipment.cargoInfo.description || ''}`,
          amount: shipment.actualCost || shipment.estimatedCost,
          date: completedDate instanceof Date ? completedDate : new Date(completedDate),
          reference: shipment.shipmentNumber
        };
      });

      // 计算总金额
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      // 创建对账单
      const statement: Omit<Statement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
        type: 'customer',
        referenceId: customerId,
        period: { start: startDate, end: endDate },
        items,
        totalAmount,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy
      };

      const createdStatement = await this.dbService.createStatement(tenantId, statement);

      // 创建应收账款记录
      await this.dbService.createFinancialRecord(tenantId, {
        type: 'receivable',
        referenceId: customerId,
        amount: totalAmount,
        currency: DEFAULT_CURRENCY,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后到期
        description: `对账单 ${createdStatement.id} - ${customer.name}`
      });

      logger.info(`Customer statement generated: ${createdStatement.id} for customer ${customerId}`);
      return createdStatement;
    } catch (error) {
      logger.error('Failed to generate customer statement:', error);
      throw error;
    }
  }

  /**
   * 生成司机结算单
   * @param tenantId 租户ID
   * @param driverId 司机ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param generatedBy 生成人
   * @returns 生成的结算单
   */
  async generateDriverStatement(
    tenantId: string, 
    driverId: string, 
    startDate: Date, 
    endDate: Date, 
    generatedBy: string
  ): Promise<Statement> {
    try {
      // 获取司机信息
      const driver = await this.dbService.getDriver(tenantId, driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      // 获取该司机在指定期间的已完成运单
      const shipments = await this.dbService.getShipments(tenantId, {
        filters: { driverId, startDate, endDate, status: 'completed' }
      });

      if (!shipments.data || shipments.data.length === 0) {
        throw new Error('No completed shipments found for the specified period');
      }

      // 计算每单的薪酬
      const items: StatementItem[] = [];
      let totalCommission = 0;

      for (const shipment of shipments.data) {
        // 使用规则引擎计算薪酬
        const facts = {
          shipmentId: shipment.id,
          driverId: shipment.driverId,
          finalCost: shipment.actualCost || shipment.estimatedCost,
          distance: shipment.transportDistance || 0,
          weight: shipment.cargoInfo.weight,
          volume: shipment.cargoInfo.volume,
          deliveryTime: (shipment.timeline?.delivered && shipment.timeline?.pickupInProgress) 
            ? (new Date(shipment.timeline.delivered).getTime() - new Date(shipment.timeline.pickupInProgress).getTime())
            : 0,
          customerLevel: shipment.customer?.level || 'standard'
        };

        const ruleResult = await this.ruleEngineService.executeRules(tenantId, facts);
        
        // 计算薪酬
        let commission = 0;
        for (const event of ruleResult.events) {
          if (event.type === 'rule-executed') {
            const actions = event.params?.actions || [];
            for (const action of actions) {
              if (action.type === 'setDriverCommission') {
                commission = facts.finalCost * (action.params.percentage / 100);
                break;
              }
            }
          }
        }

        // 如果没有规则计算薪酬，使用默认比例
        if (commission === 0) {
          commission = facts.finalCost * 0.3; // 默认30%
        }

        const completedDate = shipment.timeline?.completed 
          ? (typeof shipment.timeline.completed === 'string' ? new Date(shipment.timeline.completed) : shipment.timeline.completed)
          : (typeof shipment.createdAt === 'string' ? new Date(shipment.createdAt) : shipment.createdAt);
        
        items.push({
          id: shipment.id,
          description: `运单 ${shipment.shipmentNumber} - ${shipment.cargoInfo.description || ''}`,
          amount: commission,
          date: completedDate instanceof Date ? completedDate : new Date(completedDate),
          reference: shipment.shipmentNumber
        });

        totalCommission += commission;
      }

      // 创建结算单
      const statement: Omit<Statement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
        type: 'driver',
        referenceId: driverId,
        period: { start: startDate, end: endDate },
        items,
        totalAmount: totalCommission,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy
      };

      const createdStatement = await this.dbService.createStatement(tenantId, statement);

      // 创建应付账款记录
      await this.dbService.createFinancialRecord(tenantId, {
        type: 'payable',
        referenceId: driverId,
        amount: totalCommission,
        currency: DEFAULT_CURRENCY,
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后到期
        description: `结算单 ${createdStatement.id} - ${driver.name}`
      });

      logger.info(`Driver statement generated: ${createdStatement.id} for driver ${driverId}`);
      return createdStatement;
    } catch (error) {
      logger.error('Failed to generate driver statement:', error);
      throw error;
    }
  }

  /**
   * 标记对账单为已发送
   * @param tenantId 租户ID
   * @param statementId 对账单ID
   * @returns 更新后的对账单
   */
  async markStatementAsSent(tenantId: string, statementId: string): Promise<Statement> {
    try {
      const statement = await this.dbService.getStatement(tenantId, statementId);
      if (!statement) {
        throw new Error('Statement not found');
      }

      if (statement.status !== 'draft') {
        throw new Error('Only draft statements can be marked as sent');
      }

      return await this.dbService.updateStatement(tenantId, statementId, {
        status: 'sent'
      });
    } catch (error) {
      logger.error('Failed to mark statement as sent:', error);
      throw error;
    }
  }

  /**
   * 标记对账单为已支付
   * @param tenantId 租户ID
   * @param statementId 对账单ID
   * @param paidAmount 支付金额
   * @param paymentDate 支付日期
   * @returns 更新后的对账单
   */
  async markStatementAsPaid(
    tenantId: string, 
    statementId: string, 
    paidAmount: number, 
    paymentDate: Date = new Date()
  ): Promise<Statement> {
    try {
      const statement = await this.dbService.getStatement(tenantId, statementId);
      if (!statement) {
        throw new Error('Statement not found');
      }

      if (statement.status === 'paid') {
        throw new Error('Statement is already paid');
      }

      // 更新对账单状态
      const updatedStatement = await this.dbService.updateStatement(tenantId, statementId, {
        status: 'paid'
      });

      // 更新财务记录
      const financialRecords = await this.dbService.getFinancialRecords(tenantId, {
        filters: {
          referenceId: statement.referenceId,
          type: statement.type === 'customer' ? 'receivable' : 'payable'
        }
      });

      for (const record of financialRecords.data || []) {
        if (record.status === 'pending' || record.status === 'overdue') {
          await this.dbService.updateFinancialRecord(tenantId, record.id, {
            status: 'paid',
            paidAt: paymentDate
          });
        }
      }

      logger.info(`Statement marked as paid: ${statementId}, amount: ${paidAmount}`);
      return updatedStatement;
    } catch (error) {
      logger.error('Failed to mark statement as paid:', error);
      throw error;
    }
  }

  /**
   * 获取财务报告
   * @param tenantId 租户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 财务报告
   */
  async getFinancialReport(tenantId: string, startDate: Date, endDate: Date): Promise<FinancialReport> {
    try {
      // 获取收入数据
      const revenueQuery = `
        SELECT 
          DATE_TRUNC('month', s.created_at) as month,
          SUM(COALESCE(s.actual_cost, s.estimated_cost)) as monthly_revenue,
          s.customer_id,
          c.name as customer_name
        FROM shipments s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.tenant_id = $1 
          AND s.status = 'completed'
          AND s.created_at >= $2 
          AND s.created_at <= $3
        GROUP BY DATE_TRUNC('month', s.created_at), s.customer_id, c.name
        ORDER BY month
      `;

      const revenueResult = await this.dbService.query(revenueQuery, [tenantId, startDate, endDate]);

      // 获取支出数据
      const expensesQuery = `
        SELECT 
          type,
          SUM(amount) as total_amount
        FROM financial_records
        WHERE tenant_id = $1 
          AND type IN ('payable', 'expense')
          AND status = 'paid'
          AND paid_at >= $2 
          AND paid_at <= $3
        GROUP BY type
      `;

      const expensesResult = await this.dbService.query(expensesQuery, [tenantId, startDate, endDate]);

      // 处理收入数据
      const totalRevenue = revenueResult.reduce((sum, row) => sum + parseFloat(row.monthly_revenue), 0);
      const revenueByMonth: Record<string, number> = {};
      const revenueByCustomer: Record<string, number> = {};

      revenueResult.forEach(row => {
        const month = row.month.toISOString().substring(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(row.monthly_revenue);
        revenueByCustomer[row.customer_name] = (revenueByCustomer[row.customer_name] || 0) + parseFloat(row.monthly_revenue);
      });

      // 处理支出数据
      const totalExpenses = expensesResult.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
      const driverPayroll = expensesResult.find(row => row.type === 'payable')?.total_amount || 0;
      const operational = expensesResult.find(row => row.type === 'expense')?.total_amount || 0;

      // 计算利润
      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        period: { start: startDate, end: endDate },
        revenue: {
          total: totalRevenue,
          byMonth: revenueByMonth,
          byCustomer: revenueByCustomer
        },
        expenses: {
          total: totalExpenses,
          driverPayroll: parseFloat(driverPayroll),
          operational: parseFloat(operational)
        },
        profit,
        profitMargin
      };
    } catch (error) {
      logger.error('Failed to get financial report:', error);
      throw error;
    }
  }

  /**
   * 获取司机薪酬汇总（按双周/按月）
   * @param tenantId 租户ID
   * @param periodType 汇总类型：'biweekly' | 'monthly'
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param driverId 可选的司机ID
   * @returns 司机薪酬汇总列表
   */
  async getDriverPayrollSummary(
    tenantId: string,
    periodType: 'biweekly' | 'monthly',
    startDate?: Date,
    endDate?: Date,
    driverId?: string
  ): Promise<Array<{
    period: string; // 格式：'2024-01-01 to 2024-01-14' 或 '2024-01'
    driverId: string;
    driverName: string;
    tripsCompleted: number;
    shipmentsCompleted: number;
    totalDistance: number;
    totalEarnings: number;
    baseSalary: number;
    tripBonus: number;
    fuelAllowance: number;
    bonus?: number; // 2025-12-02T18:45:00Z 奖金（手动调整）
    status: 'pending' | 'paid';
    payDate?: Date;
    statementId?: string;
    trips: Array<{
      tripId: string;
      tripNo: string;
      shipments: Array<{
        shipmentId: string;
        shipmentNumber: string;
        amount: number;
        completedAt: Date;
      }>;
    }>;
  }>> {
    try {
      // 2025-11-30T10:50:00Z Added by Assistant: 获取司机薪酬汇总数据
      // 获取已完成运单，按司机和周期分组
      let shipmentsQuery = `
        SELECT 
          s.id as shipment_id,
          s.shipment_number,
          s.driver_id,
          d.name as driver_name,
          s.actual_cost,
          s.estimated_cost,
          s.status,
          s.timeline,
          s.created_at,
          s.updated_at,
          fr.amount as payable_amount,
          fr.status as payable_status,
          fr.paid_at,
          st.id as statement_id
        FROM shipments s
        LEFT JOIN drivers d ON s.driver_id = d.id AND s.tenant_id = d.tenant_id
        LEFT JOIN financial_records fr ON fr.reference_id = s.driver_id 
          AND fr.type = 'payable' 
          AND fr.tenant_id = s.tenant_id
        LEFT JOIN statements st ON st.reference_id = s.driver_id 
          AND st.type = 'driver'
          AND st.tenant_id = s.tenant_id
        WHERE s.tenant_id = $1
          AND s.status = 'completed'
          AND s.driver_id IS NOT NULL
      `;

      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (driverId) {
        shipmentsQuery += ` AND s.driver_id = $${paramIndex}`;
        queryParams.push(driverId);
        paramIndex++;
      }

      if (startDate) {
        shipmentsQuery += ` AND s.updated_at >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        shipmentsQuery += ` AND s.updated_at <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      shipmentsQuery += ` ORDER BY s.updated_at DESC`;

      const shipments = await this.dbService.query(shipmentsQuery, queryParams);

      // 按周期分组
      const grouped: Map<string, any> = new Map();

      for (const shipment of shipments) {
        const completedDate = shipment.timeline?.completed 
          ? new Date(shipment.timeline.completed) 
          : new Date(shipment.updated_at);
        
        let periodKey: string;
        if (periodType === 'biweekly') {
          // 双周：每两周一个周期，从每月1号开始
          const year = completedDate.getFullYear();
          const month = completedDate.getMonth();
          const day = completedDate.getDate();
          const weekOfMonth = Math.floor((day - 1) / 14);
          const periodStart = new Date(year, month, weekOfMonth * 14 + 1);
          const periodEnd = new Date(year, month, Math.min(weekOfMonth * 14 + 14, new Date(year, month + 1, 0).getDate()));
          periodKey = `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`;
        } else {
          // 按月
          periodKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
        }

        const key = `${periodKey}_${shipment.driver_id}`;
        
        if (!grouped.has(key)) {
          grouped.set(key, {
            period: periodKey,
            driverId: shipment.driver_id,
            driverName: shipment.driver_name || '未知司机',
            tripsCompleted: 0,
            shipmentsCompleted: 0,
            totalDistance: 0,
            totalEarnings: 0,
            baseSalary: 0,
            tripBonus: 0,
            fuelAllowance: 0,
            status: shipment.payable_status === 'paid' ? 'paid' : 'pending',
            payDate: shipment.paid_at,
            statementId: shipment.statement_id,
            trips: []
          });
        }

        const group = grouped.get(key);
        group.shipmentsCompleted += 1;
        
        // 计算薪酬（使用应付金额或默认30%）
        const amount = shipment.payable_amount || (shipment.actual_cost || shipment.estimated_cost || 0) * 0.3;
        group.totalEarnings += amount;
        group.tripBonus += amount * 0.7; // 假设70%是行程奖金
        group.fuelAllowance += amount * 0.1; // 假设10%是燃油补贴
        group.baseSalary = 0; // 基础工资需要单独计算
      }

      // 获取行程信息
      for (const [key, group] of grouped.entries()) {
        const tripsQuery = `
          SELECT t.id, t.trip_no, t.shipments
          FROM trips t
          WHERE t.tenant_id = $1
            AND t.driver_id = $2
            AND t.status IN ('completed', 'ongoing')
        `;
        const trips = await this.dbService.query(tripsQuery, [tenantId, group.driverId]);
        
        for (const trip of trips) {
          const tripShipments = trip.shipments || [];
          const relevantShipments = shipments.filter((s: any) => 
            tripShipments.includes(s.shipment_id) && 
            s.driver_id === group.driverId
          );
          
          if (relevantShipments.length > 0) {
            group.trips.push({
              tripId: trip.id,
              tripNo: trip.trip_no,
              shipments: relevantShipments.map((s: any) => ({
                shipmentId: s.shipment_id,
                shipmentNumber: s.shipment_number,
                amount: s.payable_amount || (s.actual_cost || s.estimated_cost || 0) * 0.3,
                completedAt: s.timeline?.completed ? new Date(s.timeline.completed) : new Date(s.updated_at)
              }))
            });
            group.tripsCompleted += 1;
          }
        }
      }

      return Array.from(grouped.values());
    } catch (error) {
      logger.error('Failed to get driver payroll summary:', error);
      throw error;
    }
  }

  /**
   * 获取对账单列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页对账单列表
   */
  async getStatements(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Statement>> {
    try {
      return await this.dbService.getStatements(tenantId, params);
    } catch (error) {
      logger.error('Failed to get statements:', error);
      throw error;
    }
  }

  /**
   * 获取财务记录列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页财务记录列表
   */
  async getFinancialRecords(tenantId: string, params: QueryParams): Promise<PaginatedResponse<FinancialRecord>> {
    try {
      return await this.dbService.getFinancialRecords(tenantId, params);
    } catch (error) {
      logger.error('Failed to get financial records:', error);
      throw error;
    }
  }
}
