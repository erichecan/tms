// 细粒度权限控制组件
// 创建时间: 2025-09-29 22:10:00
// 作用: 资源级权限控制和用户角色管理

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Tree,
  Switch,
  message,
  Divider,
  Badge,
  Tooltip,
  Popconfirm,
  Tabs,
  Transfer,
  List,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  KeyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  SafetyCertificateOutlined as ShieldCheckOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  AuditOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
// const { TabPane } = Tabs; // 已废弃，改用items属性

interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'module' | 'page' | 'action' | 'resource';
  parentId?: string;
  children?: Permission[];
  description: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  status: 'active' | 'inactive' | 'locked';
  lastLogin: string;
  createdAt: string;
}

interface ResourcePermission {
  resourceType: 'shipment' | 'customer' | 'vehicle' | 'driver' | 'finance';
  resourceId: string;
  resourceName: string;
  permissions: string[];
  grantedBy: string;
  grantedAt: string;
}

const GranularPermissions: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [resourcePermissions, setResourcePermissions] = useState<ResourcePermission[]>([]);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟权限树数据
      const mockPermissions: Permission[] = [
        {
          id: 'P001',
          name: '运单管理',
          code: 'shipment_management',
          type: 'module',
          description: '运单相关功能模块',
          children: [
            {
              id: 'P001-01',
              name: '运单列表',
              code: 'shipment_list',
              type: 'page',
              parentId: 'P001',
              description: '查看运单列表页面',
            },
            {
              id: 'P001-02',
              name: '创建运单',
              code: 'shipment_create',
              type: 'action',
              parentId: 'P001',
              description: '创建新运单',
            },
            {
              id: 'P001-03',
              name: '编辑运单',
              code: 'shipment_edit',
              type: 'action',
              parentId: 'P001',
              description: '编辑运单信息',
            },
            {
              id: 'P001-04',
              name: '删除运单',
              code: 'shipment_delete',
              type: 'action',
              parentId: 'P001',
              description: '删除运单',
            },
          ],
        },
        {
          id: 'P002',
          name: '客户管理',
          code: 'customer_management',
          type: 'module',
          description: '客户相关功能模块',
          children: [
            {
              id: 'P002-01',
              name: '客户列表',
              code: 'customer_list',
              type: 'page',
              parentId: 'P002',
              description: '查看客户列表页面',
            },
            {
              id: 'P002-02',
              name: '客户详情',
              code: 'customer_detail',
              type: 'page',
              parentId: 'P002',
              description: '查看客户详细信息',
            },
          ],
        },
        {
          id: 'P003',
          name: '财务管理',
          code: 'finance_management',
          type: 'module',
          description: '财务相关功能模块',
          children: [
            {
              id: 'P003-01',
              name: '财务报表',
              code: 'finance_reports',
              type: 'page',
              parentId: 'P003',
              description: '查看财务报表',
            },
            {
              id: 'P003-02',
              name: '财务结算',
              code: 'finance_settlement',
              type: 'action',
              parentId: 'P003',
              description: '执行财务结算操作',
            },
          ],
        },
      ];

      // 模拟角色数据
      const mockRoles: Role[] = [
        {
          id: 'R001',
          name: '系统管理员',
          code: 'system_admin',
          description: '拥有系统所有权限',
          permissions: ['P001', 'P002', 'P003'],
          userCount: 2,
          status: 'active',
          createdAt: '2025-09-01 10:00:00',
          updatedAt: '2025-09-29 15:30:00',
        },
        {
          id: 'R002',
          name: '运单操作员',
          code: 'shipment_operator',
          description: '负责运单的创建和编辑',
          permissions: ['P001-01', 'P001-02', 'P001-03'],
          userCount: 5,
          status: 'active',
          createdAt: '2025-09-01 10:00:00',
          updatedAt: '2025-09-29 15:30:00',
        },
        {
          id: 'R003',
          name: '财务专员',
          code: 'finance_specialist',
          description: '负责财务相关操作',
          permissions: ['P003-01', 'P003-02'],
          userCount: 3,
          status: 'active',
          createdAt: '2025-09-01 10:00:00',
          updatedAt: '2025-09-29 15:30:00',
        },
      ];

      // 模拟用户数据
      const mockUsers: User[] = [
        {
          id: 'U001',
          username: 'admin',
          email: 'admin@tms.com',
          fullName: '系统管理员',
          roles: ['R001'],
          status: 'active',
          lastLogin: '2025-09-29 16:30:00',
          createdAt: '2025-09-01 10:00:00',
        },
        {
          id: 'U002',
          username: 'operator1',
          email: 'operator1@tms.com',
          fullName: '张三',
          roles: ['R002'],
          status: 'active',
          lastLogin: '2025-09-29 15:45:00',
          createdAt: '2025-09-05 09:00:00',
        },
        {
          id: 'U003',
          username: 'finance1',
          email: 'finance1@tms.com',
          fullName: '李四',
          roles: ['R003'],
          status: 'active',
          lastLogin: '2025-09-29 14:20:00',
          createdAt: '2025-09-10 14:00:00',
        },
      ];

      // 模拟资源权限数据
      const mockResourcePermissions: ResourcePermission[] = [
        {
          resourceType: 'shipment',
          resourceId: 'S001',
          resourceName: '运单-20250929-001',
          permissions: ['view', 'edit'],
          grantedBy: 'admin',
          grantedAt: '2025-09-29 10:00:00',
        },
        {
          resourceType: 'customer',
          resourceId: 'C001',
          resourceName: '客户-北京科技有限公司',
          permissions: ['view', 'edit', 'delete'],
          grantedBy: 'admin',
          grantedAt: '2025-09-29 09:30:00',
        },
        {
          resourceType: 'vehicle',
          resourceId: 'V001',
          resourceName: '车辆-京A12345',
          permissions: ['view'],
          grantedBy: 'operator1',
          grantedAt: '2025-09-29 11:15:00',
        },
      ];

      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setUsers(mockUsers);
      setResourcePermissions(mockResourcePermissions);
    } catch (error) {
      message.error('加载权限数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'gray',
      locked: 'red',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      active: '活跃',
      inactive: '非活跃',
      locked: '已锁定',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getResourceTypeColor = (type: string) => {
    const colors = {
      shipment: 'blue',
      customer: 'green',
      vehicle: 'orange',
      driver: 'purple',
      finance: 'red',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getResourceTypeText = (type: string) => {
    const texts = {
      shipment: '运单',
      customer: '客户',
      vehicle: '车辆',
      driver: '司机',
      finance: '财务',
    };
    return texts[type as keyof typeof texts] || type;
  };

  const handleCreateUser = () => {
    form.resetFields();
    setSelectedUser(null);
    setIsUserModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      status: user.status,
    });
    setIsUserModalVisible(true);
  };

  const handleCreateRole = () => {
    form.resetFields();
    setSelectedRole(null);
    setIsRoleModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description,
      permissions: role.permissions,
      status: role.status,
    });
    setIsRoleModalVisible(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
    message.success('角色删除成功');
  };

  const handleAssignResourcePermission = (userId: string, resourceId: string) => {
    Modal.confirm({
      title: '分配资源权限',
      content: '确定要为此用户分配此资源的权限吗？',
      onOk: () => {
        message.success('资源权限分配成功');
      },
    });
  };

  const userColumns = [
    {
      title: '用户信息',
      key: 'user',
      render: (_, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div><Text strong>{record.fullName}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.username} | {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[], record: User) => {
        const userRoles = roles.map(roleId => 
          roles.find(r => r === roleId) || { name: roleId }
        );
        return (
          <Space wrap>
            {userRoles.map(roleId => {
              const role = roles.find(r => r.id === roleId);
              return (
                <Tag key={roleId} color="blue">
                  {role?.name || roleId}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (time: string) => (
        <Text type="secondary">{dayjs(time).format('MM-DD HH:mm')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: User) => (
        <Space>
          <Tooltip title="编辑用户">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title="分配资源权限">
            <Button 
              type="text" 
              icon={<KeyOutlined />} 
              size="small"
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const roleColumns = [
    {
      title: '角色名称',
      key: 'role',
      render: (_, record: Role) => (
        <Space>
          <CrownOutlined />
          <div>
            <div><Text strong>{record.name}</Text></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.code}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text type="secondary">{text}</Text>
      ),
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => (
        <Badge count={count} showZero color="blue" />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time: string) => (
        <Text type="secondary">{dayjs(time).format('MM-DD HH:mm')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Role) => (
        <Space>
          <Tooltip title="编辑角色">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditRole(record)}
            />
          </Tooltip>
          <Tooltip title="查看权限">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除此角色吗？"
            onConfirm={() => handleDeleteRole(record.id)}
          >
            <Tooltip title="删除角色">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const resourcePermissionColumns = [
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      render: (type: string) => (
        <Tag color={getResourceTypeColor(type)}>
          {getResourceTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '资源名称',
      dataIndex: 'resourceName',
      key: 'resourceName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map(permission => (
            <Tag key={permission} color="green">
              {permission}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '授权人',
      dataIndex: 'grantedBy',
      key: 'grantedBy',
    },
    {
      title: '授权时间',
      dataIndex: 'grantedAt',
      key: 'grantedAt',
      render: (time: string) => (
        <Text type="secondary">{dayjs(time).format('MM-DD HH:mm')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: ResourcePermission) => (
        <Space>
          <Button size="small">编辑</Button>
          <Button size="small" danger>撤销</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs 
        defaultActiveKey="users"
        items={[
          {
            key: "users",
            label: "用户管理",
            children: (
              <Card 
                title="用户列表" 
                extra={
                  <Button 
                    type="primary" 
                    icon={<UserAddOutlined />}
                    onClick={handleCreateUser}
                  >
                    新建用户
                  </Button>
                }
              >
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: "roles",
            label: "角色管理",
            children: (
              <Card 
                title="角色列表" 
                extra={
                  <Button 
                    type="primary" 
                    icon={<UsergroupAddOutlined />}
                    onClick={handleCreateRole}
                  >
                    新建角色
                  </Button>
                }
              >
                <Table
                  columns={roleColumns}
                  dataSource={roles}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: "permissions",
            label: "权限管理",
            children: (
              <Card title="权限树">
                <Tree
                  treeData={permissions}
                  defaultExpandAll
                  titleRender={(nodeData) => (
                    <Space>
                      <ShieldCheckOutlined />
                      <Text strong>{nodeData.name}</Text>
                      <Text type="secondary">({nodeData.code})</Text>
                    </Space>
                  )}
                />
              </Card>
            )
          },
          {
            key: "resources",
            label: "资源权限",
            children: (
              <Card 
                title="资源级权限" 
                extra={
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                  >
                    分配资源权限
                  </Button>
                }
              >
                <Table
                  columns={resourcePermissionColumns}
                  dataSource={resourcePermissions}
                  rowKey={(record) => `${record.resourceType}-${record.resourceId}`}
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          }
        ]}
      />

      {/* 用户编辑模态框 */}
      <Modal
        title={selectedUser ? '编辑用户' : '新建用户'}
        open={isUserModalVisible}
        onCancel={() => setIsUserModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log('User form values:', values);
            message.success(selectedUser ? '用户更新成功' : '用户创建成功');
            setIsUserModalVisible(false);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ required: true, message: '请输入邮箱' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="fullName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="roles"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select mode="multiple" placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="locked">已锁定</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedUser ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsUserModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色编辑模态框 */}
      <Modal
        title={selectedRole ? '编辑角色' : '新建角色'}
        open={isRoleModalVisible}
        onCancel={() => setIsRoleModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log('Role form values:', values);
            message.success(selectedRole ? '角色更新成功' : '角色创建成功');
            setIsRoleModalVisible(false);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="角色代码"
                rules={[{ required: true, message: '请输入角色代码' }]}
              >
                <Input placeholder="请输入角色代码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tree
              checkable
              treeData={permissions}
              defaultExpandAll
              titleRender={(nodeData) => (
                <Space>
                  <ShieldCheckOutlined />
                  <Text>{nodeData.name}</Text>
                </Space>
              )}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedRole ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsRoleModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GranularPermissions;
