// 共享表格列定义工具
// 创建时间：2025-11-30T11:50:00Z
// 用途：统一表格列定义，避免重复代码，确保显示一致性

import React from 'react';
import { Tag } from 'antd';
import { ShipmentStatus } from '@tms/shared-types';

/**
 * 运单状态到标签的映射
 */
export const shipmentStatusMap: Record<string, { color: string; text: string }> = {
  'draft': { color: 'default', text: '草稿' },
  'pending_confirmation': { color: 'orange', text: '待确认' },
  'confirmed': { color: 'blue', text: '已确认' },
  'scheduled': { color: 'cyan', text: '已调度' },
  'pickup_in_progress': { color: 'purple', text: '提货中' },
  'in_transit': { color: 'blue', text: '运输中' },
  'delivered': { color: 'green', text: '已送达' },
  'pod_pending_review': { color: 'orange', text: '签收待审核' },
  'completed': { color: 'green', text: '已完成' },
  'cancelled': { color: 'red', text: '已取消' },
  'exception': { color: 'red', text: '异常中断' },
};

/**
 * 渲染运单状态标签
 */
export const renderShipmentStatus = (status: string | ShipmentStatus): React.ReactNode => {
  const normalizedStatus = (status || '').toLowerCase();
  const statusInfo = shipmentStatusMap[normalizedStatus] || { color: 'default', text: status || '未知' };
  return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
};

/**
 * 客户等级到标签的映射
 */
export const customerLevelMap: Record<string, { color: string; text: string }> = {
  'standard': { color: 'default', text: '普通' },
  'premium': { color: 'blue', text: '高级' },
  'vip': { color: 'purple', text: 'VIP' },
  'vip1': { color: 'purple', text: 'VIP1' },
  'vip2': { color: 'purple', text: 'VIP2' },
  'vip3': { color: 'purple', text: 'VIP3' },
  'vip4': { color: 'purple', text: 'VIP4' },
  'vip5': { color: 'purple', text: 'VIP5' },
};

/**
 * 渲染客户等级标签
 */
export const renderCustomerLevel = (level: string): React.ReactNode => {
  const normalizedLevel = (level || '').toLowerCase();
  const levelInfo = customerLevelMap[normalizedLevel] || { color: 'default', text: level || '未知' };
  return <Tag color={levelInfo.color}>{levelInfo.text}</Tag>;
};

/**
 * 通用状态标签映射
 */
export const commonStatusMap: Record<string, { color: string; text: string }> = {
  'active': { color: 'green', text: '启用' },
  'inactive': { color: 'red', text: '停用' },
  'available': { color: 'green', text: '可用' },
  'busy': { color: 'orange', text: '忙碌' },
  'offline': { color: 'default', text: '离线' },
  'pending': { color: 'orange', text: '待处理' },
  'paid': { color: 'green', text: '已支付' },
  'unpaid': { color: 'red', text: '未支付' },
  'approved': { color: 'green', text: '已批准' },
  'rejected': { color: 'red', text: '已拒绝' },
};

/**
 * 渲染通用状态标签
 */
export const renderCommonStatus = (status: string): React.ReactNode => {
  const normalizedStatus = (status || '').toLowerCase();
  const statusInfo = commonStatusMap[normalizedStatus] || { color: 'default', text: status || '未知' };
  return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
};

/**
 * 规则类型到标签的映射
 */
export const ruleTypeMap: Record<string, { color: string; text: string }> = {
  'pricing': { color: 'blue', text: '定价规则' },
  'dispatch': { color: 'green', text: '调度规则' },
  'notification': { color: 'orange', text: '通知规则' },
  'payroll': { color: 'purple', text: '薪酬规则' },
};

/**
 * 渲染规则类型标签
 */
export const renderRuleType = (type: string): React.ReactNode => {
  const normalizedType = (type || '').toLowerCase();
  const typeInfo = ruleTypeMap[normalizedType] || { color: 'default', text: type || '未知' };
  return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
};

/**
 * 规则状态到标签的映射
 */
export const ruleStatusMap: Record<string, { color: string; text: string }> = {
  'active': { color: 'green', text: '启用' },
  'inactive': { color: 'red', text: '停用' },
  'draft': { color: 'default', text: '草稿' },
};

/**
 * 渲染规则状态标签
 */
export const renderRuleStatus = (status: string): React.ReactNode => {
  const normalizedStatus = (status || '').toLowerCase();
  const statusInfo = ruleStatusMap[normalizedStatus] || { color: 'default', text: status || '未知' };
  return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
};

