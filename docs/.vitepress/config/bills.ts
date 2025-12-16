import type { Bill } from "../theme/components/content/bill";

/**
 * @description Bill data configuration
 * @type {Bill[]}
 */
export const bills: Bill[] = [
    {
        date: "2024-01-15",
        "exchanged-amount": 216.35,
        operator: "测试操作员",
        description: "测试交易内容",
        target: "测试目标",
        type: "income"
    },
    {
        date: "2024-01-16",
        "exchanged-amount": 150.00,
        operator: "系统管理员",
        description: "服务费用",
        target: "云服务提供商",
        type: "outlay"
    },
    {
        date: "2024-01-17",
        "exchanged-amount": 89.99,
        operator: "财务部门",
        description: "软件许可证",
        target: "软件供应商",
        type: "outlay"
    }
];

export default bills; 