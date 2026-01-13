
export type RuleType = 'pricing' | 'payroll';

export const RuleTypes = {
    PRICING: 'pricing' as const,
    PAYROLL: 'payroll' as const,
};

export type RuleStatus = 'active' | 'inactive';

export const RuleStatuses = {
    ACTIVE: 'active' as const,
    INACTIVE: 'inactive' as const,
};

export interface RuleCondition {
    fact: string;
    operator: string;
    value: string | number | boolean;
}

export interface RuleAction {
    type: string;
    params: Record<string, any>;
}

export interface Rule {
    id?: string;
    name: string;
    description: string;
    type: RuleType;
    priority: number;
    status: RuleStatus;
    conditions: RuleCondition[];
    actions: RuleAction[];
    created_at?: string;
}
