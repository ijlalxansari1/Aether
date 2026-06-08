import { DataRow } from './types';

// ─── Sample Dataset Generators ───────────────────────────────────────────────

export interface SampleDataset {
  name: string;
  label: string;
  icon: string;
  description: string;
  tag: string;
  color: string;
  headers: string[];
  rows: DataRow[];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSalesData(): SampleDataset {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const products = ['Product A', 'Product B', 'Product C', 'Product D'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const reps = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah'];

  const rows: DataRow[] = Array.from({ length: 60 }, (_, i) => {
    const rev = randomBetween(10000, 60000);
    return {
      month: months[i % 12],
      region: regions[i % 5],
      product: products[i % 4],
      revenue: rev,
      units: randomBetween(50, 250),
      margin_pct: parseFloat((Math.random() * 30 + 10).toFixed(1)),
      cost: Math.floor(rev * (1 - Math.random() * 0.3 - 0.1)),
      rep: reps[i % 8],
      returned: i % 7 === 0 ? null : randomBetween(0, 10),
    };
  });

  return {
    name: 'sales', label: 'Sales Analytics', icon: '🛒', tag: 'Sales', color: 'cyan',
    description: 'Monthly sales data with regions, products, revenue & margins',
    headers: ['month', 'region', 'product', 'revenue', 'units', 'margin_pct', 'cost', 'rep', 'returned'],
    rows,
  };
}

export function generateHRData(): SampleDataset {
  const depts = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager'];
  const risks = ['Low', 'Medium', 'High'];

  const rows: DataRow[] = Array.from({ length: 50 }, (_, i) => ({
    employee_id: `EMP${1000 + i}`,
    department: depts[i % 6],
    level: levels[i % 5],
    salary: randomBetween(40000, 120000),
    tenure_years: parseFloat((Math.random() * 10).toFixed(1)),
    performance: i % 13 === 0 ? null : parseFloat((Math.random() * 4 + 1).toFixed(1)),
    remote: i % 3 === 0,
    age: randomBetween(22, 52),
    attrition_risk: risks[i % 3],
  }));

  return {
    name: 'hr', label: 'HR Dataset', icon: '👥', tag: 'HR', color: 'violet',
    description: 'Employee data with departments, salaries, tenure & performance',
    headers: ['employee_id', 'department', 'level', 'salary', 'tenure_years', 'performance', 'remote', 'age', 'attrition_risk'],
    rows,
  };
}

export function generateFinanceData(): SampleDataset {
  const quarters = ['Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'];
  const categories = ['Revenue', 'COGS', 'Opex', 'EBITDA', 'Net Profit'];
  const depts = ['Sales', 'Ops', 'Finance', 'R&D'];

  const rows: DataRow[] = Array.from({ length: 40 }, (_, i) => {
    const amount = randomBetween(100000, 600000);
    return {
      quarter: quarters[i % 10],
      category: categories[i % 5],
      amount,
      budget: Math.floor(amount * (1 + (Math.random() * 0.2 - 0.1))),
      variance_pct: parseFloat((Math.random() * 20 - 10).toFixed(1)),
      yoy_growth: parseFloat((Math.random() * 30 - 5).toFixed(1)),
      dept: depts[i % 4],
      approved: i % 11 === 0 ? null : i % 2 === 0,
    };
  });

  return {
    name: 'finance', label: 'Financial KPIs', icon: '💰', tag: 'Finance', color: 'amber',
    description: 'Quarterly financials with P&L, EBITDA, burn rate, runway',
    headers: ['quarter', 'category', 'amount', 'budget', 'variance_pct', 'yoy_growth', 'dept', 'approved'],
    rows,
  };
}

export const SAMPLE_DATASETS: Record<string, () => SampleDataset> = {
  sales: generateSalesData,
  hr: generateHRData,
  finance: generateFinanceData,
};
