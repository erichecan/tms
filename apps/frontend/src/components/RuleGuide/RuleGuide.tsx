// 规则创建教程组件
// 创建时间: 2025-11-30 07:15:00

import React from 'react';
import {
  Typography,
  Card,
  Divider,
  Tag,
  Alert,
  Space,
  Table,
  Collapse,
} from 'antd';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const RuleGuide: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
      <Alert
        message="规则创建教程"
        description="本教程将帮助您理解每个字段的填写内容和意义，以及如何创建有效的规则。"
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* 一、规则创建界面字段详解 */}
      <Card title="一、规则创建界面字段详解" style={{ marginBottom: 24 }}>
        {/* 1. 规则名称 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            1. 规则名称 (name) <Tag color="red">必填</Tag>
          </Title>
          <Paragraph>
            <Text strong>字段说明：</Text>规则的唯一标识名称，用于在规则列表中识别该规则。
          </Paragraph>
          <Paragraph>
            <Text strong>填写要求：</Text>
            <ul>
              <li>长度：1-255个字符</li>
              <li>格式：建议使用中文或英文，清晰描述规则用途</li>
              <li>唯一性：同一租户内规则名称不能重复</li>
            </ul>
          </Paragraph>
          <Paragraph>
            <Text strong>填写示例：</Text>
            <Space>
              <Tag color="success" icon={<CheckCircleOutlined />}>基础运费规则</Tag>
              <Tag color="success" icon={<CheckCircleOutlined />}>VIP客户折扣</Tag>
              <Tag color="error" icon={<CloseCircleOutlined />}>规则1</Tag>
              <Tag color="error" icon={<CloseCircleOutlined />}>test</Tag>
            </Space>
          </Paragraph>
          <Paragraph>
            <Text strong>填写意义：</Text>帮助管理员快速识别规则用途，便于管理和维护。
          </Paragraph>
        </div>

        <Divider />

        {/* 2. 规则描述 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>2. 规则描述 (description) <Tag>可选</Tag></Title>
          <Paragraph>
            <Text strong>字段说明：</Text>对规则的详细说明，包括规则的应用场景、计算逻辑等。
          </Paragraph>
          <Paragraph>
            <Text strong>填写要求：</Text>
            <ul>
              <li>长度：建议不超过500个字符</li>
              <li>内容：详细说明规则的业务逻辑、适用场景、注意事项</li>
            </ul>
          </Paragraph>
          <Card size="small" style={{ marginTop: 12, background: '#f5f5f5' }}>
            <Text code>
              基础运费计算规则：适用于所有运单，按距离计算基础运费。
              <br />
              计算公式：基础运费 = 距离（公里）× 每公里费率（5元/公里）
            </Text>
          </Card>
          <Paragraph style={{ marginTop: 12 }}>
            <Text strong>填写意义：</Text>
            <ul>
              <li>帮助团队成员理解规则的业务逻辑</li>
              <li>便于后续维护和修改</li>
              <li>作为规则文档的一部分</li>
            </ul>
          </Paragraph>
        </div>

        <Divider />

        {/* 3. 规则类型 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            3. 规则类型 (type) <Tag color="red">必填</Tag>
          </Title>
          <Paragraph>
            <Text strong>字段说明：</Text>规则的应用类型，决定规则用于计费还是司机薪酬计算。
          </Paragraph>
          <Paragraph>
            <Text strong>可选值：</Text>
            <Space>
              <Tag color="blue">pricing</Tag> - 计费规则：用于计算运单费用
              <Tag color="green">payroll</Tag> - 司机薪酬规则：用于计算司机薪酬
            </Space>
          </Paragraph>
          <Card size="small" style={{ marginTop: 12 }}>
            <Title level={5}>选择 <Tag color="blue">pricing</Tag> 的情况：</Title>
            <ul>
              <li>计算运单的基础运费</li>
              <li>计算距离费用、重量费用、体积费用</li>
              <li>添加附加费用（危险品、周末配送等）</li>
              <li>应用客户折扣</li>
            </ul>
            <Title level={5} style={{ marginTop: 12 }}>选择 <Tag color="green">payroll</Tag> 的情况：</Title>
            <ul>
              <li>计算司机基础工资</li>
              <li>计算行程提成</li>
              <li>计算绩效奖金</li>
              <li>根据客户级别设置提成比例</li>
            </ul>
          </Card>
        </div>

        <Divider />

        {/* 4. 优先级 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            4. 优先级 (priority) <Tag color="red">必填</Tag>
          </Title>
          <Paragraph>
            <Text strong>字段说明：</Text>规则的执行优先级，数字越大优先级越高，越先执行。
          </Paragraph>
          <Paragraph>
            <Text strong>填写要求：</Text>
            <ul>
              <li>类型：整数</li>
              <li>范围：建议 0-1000</li>
              <li>默认值：100</li>
            </ul>
          </Paragraph>
          <Table
            size="small"
            dataSource={[
              { priority: '100-150', type: '基础规则', example: '基础运费、距离费用' },
              { priority: '150-200', type: '特殊规则', example: '危险品附加费、周末配送费' },
              { priority: '200-300', type: '折扣规则', example: 'VIP客户折扣、新客户优惠' },
              { priority: '300-400', type: '薪酬规则', example: '基础提成、高级客户提成' },
            ]}
            columns={[
              { title: '优先级范围', dataIndex: 'priority', key: 'priority' },
              { title: '规则类型', dataIndex: 'type', key: 'type' },
              { title: '示例', dataIndex: 'example', key: 'example' },
            ]}
            pagination={false}
            style={{ marginTop: 12 }}
          />
        </div>

        <Divider />

        {/* 5. 条件 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            5. 条件 (conditions) <Tag color="red">必填</Tag>
          </Title>
          <Paragraph>
            <Text strong>字段说明：</Text>规则触发的条件，当所有条件都满足时，规则才会执行。
          </Paragraph>
          <Card size="small" style={{ marginTop: 12, background: '#f5f5f5' }}>
            <Text code>
              {`[
  {
    "fact": "字段名",
    "operator": "操作符",
    "value": "比较值"
  }
]`}
            </Text>
          </Card>

          <Collapse 
            style={{ marginTop: 16 }}
            items={[
              {
                key: 'fact',
                label: '5.1 事实 (fact) - 条件字段',
                children: (
                  <>
                    <Paragraph>
                      <Text strong>运单相关事实：</Text>
                      <ul>
                        <li><Text code>distance</Text> - 距离（公里，数字）</li>
                        <li><Text code>weight</Text> - 重量（公斤，数字）</li>
                        <li><Text code>volume</Text> - 体积（立方米，数字）</li>
                        <li><Text code>isHazardous</Text> - 是否危险品（布尔值：true/false）</li>
                        <li><Text code>weekendDelivery</Text> - 是否周末配送（布尔值：true/false）</li>
                        <li><Text code>customerLevel</Text> - 客户级别（字符串：'vip' | 'premium' | 'standard'）</li>
                        <li><Text code>pickupCity</Text> - 取货城市（字符串）</li>
                        <li><Text code>deliveryCity</Text> - 送货城市（字符串）</li>
                      </ul>
                    </Paragraph>
                    <Paragraph>
                      <Text strong>司机相关事实（仅用于payroll规则）：</Text>
                      <ul>
                        <li><Text code>driverLevel</Text> - 司机等级（字符串）</li>
                        <li><Text code>driverRating</Text> - 司机评分（数字）</li>
                        <li><Text code>totalDeliveries</Text> - 总配送次数（数字）</li>
                        <li><Text code>onTimeRate</Text> - 准时率（数字，0-100）</li>
                      </ul>
                    </Paragraph>
                  </>
                ),
              },
              {
                key: 'operator',
                label: '5.2 操作符 (operator) - 比较方式',
                children: (
                  <Table
                    size="small"
                    dataSource={[
                      { operator: 'equal', desc: '等于', type: '字符串、数字、布尔值', example: '"customerLevel" equal "vip"', key: 'equal' },
                      { operator: 'notEqual', desc: '不等于', type: '字符串、数字、布尔值', example: '"isHazardous" notEqual true', key: 'notEqual' },
                      { operator: 'greaterThan', desc: '大于', type: '数字', example: '"distance" greaterThan 100', key: 'greaterThan' },
                      { operator: 'lessThan', desc: '小于', type: '数字', example: '"weight" lessThan 1000', key: 'lessThan' },
                      { operator: 'greaterThanInclusive', desc: '大于等于', type: '数字', example: '"distance" greaterThanInclusive 50', key: 'greaterThanInclusive' },
                      { operator: 'lessThanInclusive', desc: '小于等于', type: '数字', example: '"weight" lessThanInclusive 2000', key: 'lessThanInclusive' },
                      { operator: 'in', desc: '包含在数组中', type: '字符串、数字', example: '"customerLevel" in ["vip", "premium"]', key: 'in' },
                      { operator: 'notIn', desc: '不包含在数组中', type: '字符串、数字', example: '"pickupCity" notIn ["北京", "上海"]', key: 'notIn' },
                      { operator: 'contains', desc: '字符串包含', type: '字符串', example: '"pickupCity" contains "北京"', key: 'contains' },
                    ]}
                    columns={[
                      { title: '操作符', dataIndex: 'operator', key: 'operator', width: 200 },
                      { title: '说明', dataIndex: 'desc', key: 'desc' },
                      { title: '适用类型', dataIndex: 'type', key: 'type' },
                      { title: '示例', dataIndex: 'example', key: 'example' },
                    ]}
                    pagination={false}
                  />
                ),
              },
            ]}
          />
        </div>

        <Divider />

        {/* 6. 动作 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            6. 动作 (actions) <Tag color="red">必填</Tag>
          </Title>
          <Paragraph>
            <Text strong>字段说明：</Text>当条件满足时执行的操作，定义规则的具体业务逻辑。
          </Paragraph>

          <Collapse 
            style={{ marginTop: 16 }}
            items={[
              {
                key: 'pricing-actions',
                label: '6.1 计费规则动作 (pricing)',
                children: (
                  <>
                    <Title level={5}>calculateBaseFee - 计算基础费用</Title>
                    <Paragraph>根据距离计算基础运费</Paragraph>
                    <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                      <Text code>
                        {`{
  "type": "calculateBaseFee",
  "params": {
    "ratePerKm": 5
  }
}`}
                      </Text>
                    </Card>
                    <Paragraph style={{ marginTop: 8 }}>含义：按每公里5元计算基础运费</Paragraph>

                    <Divider style={{ margin: '16px 0' }} />

                    <Title level={5}>addFee - 添加固定费用</Title>
                    <Paragraph>添加固定的附加费用</Paragraph>
                    <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                      <Text code>
                        {`{
  "type": "addFee",
  "params": {
    "amount": 200,
    "description": "危险品附加费"
  }
}`}
                      </Text>
                    </Card>

                    <Divider style={{ margin: '16px 0' }} />

                    <Title level={5}>applyDiscount - 应用折扣</Title>
                    <Paragraph>对总费用应用百分比折扣</Paragraph>
                    <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                      <Text code>
                        {`{
  "type": "applyDiscount",
  "params": {
    "percentage": 10
  }
}`}
                      </Text>
                    </Card>
                    <Paragraph style={{ marginTop: 8 }}>含义：应用10%的折扣（即打9折）</Paragraph>
                  </>
                ),
              },
              {
                key: 'payroll-actions',
                label: '6.2 司机薪酬规则动作 (payroll)',
                children: (
                  <>
                    <Title level={5}>setDriverCommission - 设置司机提成</Title>
                    <Paragraph>设置司机提成比例</Paragraph>
                    <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                      <Text code>
                        {`{
  "type": "setDriverCommission",
  "params": {
    "percentage": 30
  }
}`}
                      </Text>
                    </Card>
                    <Paragraph style={{ marginTop: 8 }}>含义：设置司机提成为30%</Paragraph>
                  </>
                ),
              },
            ]}
          />
        </div>

        <Divider />

        {/* 7. 状态 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>7. 状态 (status) <Tag>可选</Tag></Title>
          <Paragraph>
            <Text strong>字段说明：</Text>规则是否激活
          </Paragraph>
          <Paragraph>
            <Text strong>可选值：</Text>
            <Space>
              <Tag color="success">active</Tag> - 激活：规则会被执行
              <Tag color="default">inactive</Tag> - 停用：规则不会被执行
            </Space>
          </Paragraph>
          <Paragraph>
            <Text strong>使用场景：</Text>
            <ul>
              <li>创建新规则时，建议先设置为 <Text code>inactive</Text>，测试通过后再设置为 <Text code>active</Text></li>
              <li>需要临时停用规则时，设置为 <Text code>inactive</Text></li>
              <li>需要重新启用规则时，设置为 <Text code>active</Text></li>
            </ul>
          </Paragraph>
        </div>
      </Card>

      {/* 二、规则创建完整示例 */}
      <Card title="二、规则创建完整示例" style={{ marginBottom: 24 }}>
        <Collapse
          items={[
            {
              key: 'example1',
              label: '示例1：基础运费规则',
              children: (
                <>
                  <Paragraph>
                    <Text strong>场景：</Text>所有运单都需要计算基础运费，按每公里5元计算。
                  </Paragraph>
                  <Paragraph>
                    <Text strong>填写步骤：</Text>
                  </Paragraph>
                  <ol>
                    <li><Text strong>规则名称：</Text><Text code>基础运费规则</Text></li>
                    <li><Text strong>规则描述：</Text>适用于所有运单的基础运费计算，按距离计算，每公里5元</li>
                    <li><Text strong>规则类型：</Text><Tag color="blue">pricing</Tag></li>
                    <li><Text strong>优先级：</Text><Text code>100</Text></li>
                    <li>
                      <Text strong>条件：</Text>
                      <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                        <Text code>
                          {`[
  {
    "fact": "distance",
    "operator": "greaterThan",
    "value": 0
  }
]`}
                        </Text>
                      </Card>
                    </li>
                    <li>
                      <Text strong>动作：</Text>
                      <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                        <Text code>
                          {`[
  {
    "type": "calculateBaseFee",
    "params": {
      "ratePerKm": 5
    }
  }
]`}
                        </Text>
                      </Card>
                    </li>
                    <li><Text strong>状态：</Text><Tag color="success">active</Tag></li>
                  </ol>
                  <Alert
                    message="业务逻辑"
                    description="当运单距离大于0公里时，按每公里5元计算基础运费。"
                    type="info"
                    style={{ marginTop: 16 }}
                  />
                </>
              ),
            },
            {
              key: 'example2',
              label: '示例2：危险品附加费规则',
              children: (
                <>
                  <Paragraph>
                    <Text strong>场景：</Text>运输危险品时，额外收取200元附加费。
                  </Paragraph>
                  <ol>
                    <li><Text strong>规则名称：</Text><Text code>危险品附加费</Text></li>
                    <li><Text strong>规则类型：</Text><Tag color="blue">pricing</Tag></li>
                    <li><Text strong>优先级：</Text><Text code>150</Text>（高于基础运费，先执行）</li>
                    <li>
                      <Text strong>条件：</Text>
                      <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                        <Text code>
                          {`[
  {
    "fact": "isHazardous",
    "operator": "equal",
    "value": true
  }
]`}
                        </Text>
                      </Card>
                    </li>
                    <li>
                      <Text strong>动作：</Text>
                      <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                        <Text code>
                          {`[
  {
    "type": "addFee",
    "params": {
      "amount": 200,
      "description": "危险品附加费"
    }
  }
]`}
                        </Text>
                      </Card>
                    </li>
                  </ol>
                </>
              ),
            },
            {
              key: 'example3',
              label: '示例3：VIP客户折扣规则',
              children: (
                <>
                  <Paragraph>
                    <Text strong>场景：</Text>VIP客户享受10%的折扣。
                  </Paragraph>
                  <ol>
                    <li><Text strong>规则名称：</Text><Text code>VIP客户折扣</Text></li>
                    <li><Text strong>规则类型：</Text><Tag color="blue">pricing</Tag></li>
                    <li><Text strong>优先级：</Text><Text code>200</Text>（最高优先级，最后执行，对总费用打折）</li>
                    <li>
                      <Text strong>条件：</Text>
                      <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                        <Text code>
                          {`[
  {
    "fact": "customerLevel",
    "operator": "equal",
    "value": "vip"
  }
]`}
                        </Text>
                      </Card>
                    </li>
                    <li>
                      <Text strong>动作：</Text>
                      <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                        <Text code>
                          {`[
  {
    "type": "applyDiscount",
    "params": {
      "percentage": 10
    }
  }
]`}
                        </Text>
                      </Card>
                    </li>
                  </ol>
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 三、规则执行流程 */}
      <Card title="三、规则执行流程" style={{ marginBottom: 24 }}>
        <Paragraph>
          <Text strong>规则执行顺序：</Text>
        </Paragraph>
        <ol>
          <li><Text strong>按优先级排序：</Text>优先级数字越大，越先执行</li>
          <li><Text strong>检查条件：</Text>遍历所有激活的规则，检查条件是否满足</li>
          <li><Text strong>执行动作：</Text>如果条件满足，执行规则的动作</li>
          <li><Text strong>继续检查：</Text>继续检查下一个规则</li>
          <li><Text strong>返回结果：</Text>所有规则执行完毕后，返回最终结果</li>
        </ol>
      </Card>

      {/* 四、最佳实践 */}
      <Card title="四、规则管理最佳实践" style={{ marginBottom: 24 }}>
        <Title level={5}>1. 规则命名规范</Title>
        <Space>
          <Tag color="success" icon={<CheckCircleOutlined />}>使用清晰的中文或英文名称</Tag>
          <Tag color="success" icon={<CheckCircleOutlined />}>包含规则类型和用途</Tag>
          <Tag color="error" icon={<CloseCircleOutlined />}>避免使用模糊的名称</Tag>
        </Space>

        <Title level={5} style={{ marginTop: 16 }}>2. 优先级设置建议</Title>
        <ul>
          <li><Text strong>基础规则：</Text>100-150</li>
          <li><Text strong>特殊规则：</Text>150-200</li>
          <li><Text strong>折扣规则：</Text>200-300</li>
          <li><Text strong>薪酬规则：</Text>300-400</li>
        </ul>

        <Title level={5} style={{ marginTop: 16 }}>3. 测试规则</Title>
        <Paragraph>创建规则后：</Paragraph>
        <ol>
          <li>先设置为 <Text code>inactive</Text> 状态</li>
          <li>使用规则测试功能验证</li>
          <li>使用不同的输入数据测试</li>
          <li>验证规则执行结果</li>
          <li>确认无误后设置为 <Text code>active</Text></li>
        </ol>
      </Card>

      {/* 五、常见问题 */}
      <Card title="五、常见问题解答">
        <Collapse
          items={[
            {
              key: 'faq1',
              label: 'Q1: 规则不生效怎么办？',
              children: (
                <>
                  <Paragraph>
                    <Text strong>检查清单：</Text>
                  </Paragraph>
                  <ul>
                    <li>✅ 规则状态是否为 <Text code>active</Text></li>
                    <li>✅ 规则条件是否正确</li>
                    <li>✅ 输入数据是否满足条件</li>
                    <li>✅ 规则优先级是否合适</li>
                    <li>✅ 是否有其他规则覆盖</li>
                  </ul>
                </>
              ),
            },
            {
              key: 'faq2',
              label: 'Q2: 如何调试规则？',
              children: (
                <>
                  <Paragraph>
                    <Text strong>方法：</Text>
                  </Paragraph>
                  <ul>
                    <li>使用规则测试功能</li>
                    <li>查看规则执行日志</li>
                    <li>检查规则执行顺序</li>
                    <li>验证输入数据</li>
                  </ul>
                </>
              ),
            },
            {
              key: 'faq3',
              label: 'Q3: 规则可以删除吗？',
              children: (
                <>
                  <Paragraph>
                    <Text strong>建议：</Text>
                  </Paragraph>
                  <ol>
                    <li>先设置为 <Text code>inactive</Text> 停用</li>
                    <li>观察一段时间确认无影响</li>
                    <li>再删除规则</li>
                  </ol>
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default RuleGuide;

