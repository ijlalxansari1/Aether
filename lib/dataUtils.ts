import { ColumnType, DataRow, ColProfile, QualityIssue } from './types';

// ─── Type Inference ──────────────────────────────────────────────────────────
export function isSmartNumber(v: unknown): boolean {
  if (typeof v === 'number') return true;
  if (typeof v !== 'string') return false;
  const str = v.trim();
  if (str === '') return false;
  const clean = str.replace(/[$,%€£\s]/g, '');
  return !isNaN(Number(clean)) && clean !== '';
}

export function smartCastValue(v: unknown): unknown {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return v;
  const str = v.trim();
  if (str === '') return v;
  const clean = str.replace(/[$,%€£\s]/g, '');
  if (!isNaN(Number(clean)) && clean !== '') {
    if (str.endsWith('%')) return Number(clean) / 100;
    return Number(clean);
  }
  return v;
}

export function smartCastData(rows: DataRow[], headers: string[]): DataRow[] {
  // Determine which string columns are actually "smart numbers"
  const smartCols = new Set<string>();
  for (const h of headers) {
    const nonNull = rows.filter(r => r[h] !== null && r[h] !== undefined && r[h] !== '');
    if (nonNull.length > 0 && nonNull.every(r => isSmartNumber(r[h]))) {
      smartCols.add(h);
    }
  }

  if (smartCols.size === 0) return rows;

  return rows.map(r => {
    const newRow = { ...r };
    for (const h of smartCols) {
      if (newRow[h] !== null && newRow[h] !== undefined && newRow[h] !== '') {
        newRow[h] = smartCastValue(newRow[h]) as string | number | boolean | null;
      }
    }
    return newRow;
  });
}

export function inferType(values: unknown[]): ColumnType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (!nonNull.length) return 'string';
  if (nonNull.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean';
  if (nonNull.every(v => typeof v === 'number' && !isNaN(v as number))) return 'number';
  if (nonNull.every(v => typeof v === 'string' && !isNaN(Date.parse(v as string)) && (v as string).includes('-'))) return 'date';
  return 'string';
}

export function isPII(colName: string, values: unknown[]): boolean {
  if (colName.toLowerCase().match(/(email|phone|ssn|social|password)/)) return true;
  const nonNull = values.filter(v => typeof v === 'string' && v.trim() !== '');
  if (!nonNull.length) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9\s\-\(\)]{7,15}$/;
  let matchCount = 0;
  for (let i = 0; i < Math.min(nonNull.length, 10); i++) {
    const val = String(nonNull[i]);
    if (emailRegex.test(val) || phoneRegex.test(val)) matchCount++;
  }
  return matchCount > 0;
}

export function inferTypes(headers: string[], rows: DataRow[]): Record<string, ColumnType> {
  const types: Record<string, ColumnType> = {};
  headers.forEach(h => {
    types[h] = inferType(rows.map(r => r[h]));
  });
  return types;
}

// ─── Column Profile ───────────────────────────────────────────────────────────
export function profileColumn(col: string, type: ColumnType, rows: DataRow[]): ColProfile {
  const allVals = rows.map(r => r[col]);
  const nulls = allVals.filter(v => v === null || v === undefined || v === '').length;
  const vals = allVals.filter(v => v !== null && v !== undefined && v !== '');
  const count = vals.length;

  if (type === 'number') {
    const nums = vals.map(v => Number(v));
    if (!nums.length) return { name: col, type, count: 0, nulls, mean: 0, median: 0, std: 0, min: 0, max: 0 };
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const sorted = [...nums].sort((a, b) => a - b);
    const median = sorted[Math.floor(count / 2)];
    const std = Math.sqrt(nums.reduce((a, v) => a + (v - mean) ** 2, 0) / count);
    return { name: col, type, count, nulls, mean, median, std, min: Math.min(...nums), max: Math.max(...nums) };
  }

  const unique = new Set(vals.map(String)).size;
  const freq: Record<string, number> = {};
  vals.map(String).forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return { name: col, type, count, nulls, unique, topValue: top?.[0] ?? '—', topFreq: top?.[1] ?? 0 };
}

// ─── Quality Issues ───────────────────────────────────────────────────────────
export function detectIssues(headers: string[], rows: DataRow[], types: Record<string, ColumnType>): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // Nulls per column
  headers.forEach(h => {
    const nulls = rows.filter(r => r[h] === null || r[h] === undefined || r[h] === '').length;
    if (nulls > 0) {
      const ratio = nulls / rows.length;
      issues.push({ type: 'null', column: h, count: nulls, severity: ratio > 0.1 ? 'high' : 'medium' });
    }
  });

  // Duplicates
  const seen = new Set<string>();
  let dups = 0;
  rows.forEach(r => { const k = JSON.stringify(r); if (seen.has(k)) dups++; else seen.add(k); });
  if (dups > 0) issues.push({ type: 'duplicate', column: 'all', count: dups, severity: 'high' });

  // Outliers (3σ)
  headers.filter(h => types[h] === 'number').forEach(h => {
    const nums = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
    if (!nums.length) return;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const std = Math.sqrt(nums.reduce((a, v) => a + (v - mean) ** 2, 0) / nums.length);
    const outliers = nums.filter(v => Math.abs(v - mean) > 3 * std).length;
    if (outliers > 0) issues.push({ type: 'outlier', column: h, count: outliers, severity: 'low' });
  });

  return issues;
}

// ─── Intelligent Clean Ops ──────────────────────────────────────────────────────

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export function consolidateCategories(rows: DataRow[], col: string, maxDistance: number = 2): DataRow[] {
  // Find all unique non-null string values
  const uniqueVals = Array.from(new Set(
    rows.map(r => r[col]).filter(v => typeof v === 'string' && v.trim() !== '') as string[]
  ));
  
  if (uniqueVals.length < 2) return rows;

  // We map variations to their most frequent/standard representation
  // First, find frequencies
  const freqs: Record<string, number> = {};
  rows.forEach(r => {
    const val = r[col];
    if (typeof val === 'string') freqs[val] = (freqs[val] || 0) + 1;
  });

  const sortedUnique = uniqueVals.sort((a, b) => freqs[b] - freqs[a]);
  const mapping: Record<string, string> = {};

  for (let i = 0; i < sortedUnique.length; i++) {
    const target = sortedUnique[i];
    if (mapping[target]) continue; // Already mapped
    mapping[target] = target; // Maps to itself

    for (let j = i + 1; j < sortedUnique.length; j++) {
      const candidate = sortedUnique[j];
      if (mapping[candidate]) continue; // Already mapped
      
      const dist = levenshteinDistance(target, candidate);
      // We allow up to maxDistance edits, or a strict substring match for things like (NY vs N.Y.)
      if (dist <= maxDistance || target.replace(/[^a-zA-Z]/g, '').toLowerCase() === candidate.replace(/[^a-zA-Z]/g, '').toLowerCase()) {
        mapping[candidate] = target;
      }
    }
  }

  // Apply mapping
  return rows.map(r => {
    if (typeof r[col] === 'string' && mapping[r[col]]) {
      return { ...r, [col]: mapping[r[col]] };
    }
    return r;
  });
}

// ─── Cleaning Operations ─────────────────────────────────────────────────────
export function applyCleanOp(op: string, rows: DataRow[], headers: string[], types: Record<string, ColumnType>): DataRow[] {
  let data = rows.map(r => ({ ...r }));

  if (op === 'remove_dups') {
    const seen = new Set<string>();
    data = data.filter(r => { const k = JSON.stringify(r); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  if (op === 'fill_nulls') {
    headers.forEach(h => {
      if (types[h] === 'number') {
        const vals = data.map(r => Number(r[h])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        const median = vals[Math.floor(vals.length / 2)] ?? 0;
        data.forEach(r => { if (r[h] === null || r[h] === undefined || r[h] === '') r[h] = median; });
      } else {
        data.forEach(r => { if (r[h] === null || r[h] === undefined || r[h] === '') r[h] = 'Unknown'; });
      }
    });
  }

  if (op === 'cap_outliers') {
    headers.filter(h => types[h] === 'number').forEach(h => {
      const vals = data.map(r => Number(r[h])).filter(v => !isNaN(v)).sort((a, b) => a - b);
      const q1 = vals[Math.floor(vals.length * 0.25)];
      const q3 = vals[Math.floor(vals.length * 0.75)];
      const iqr = q3 - q1;
      const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
      data.forEach(r => { if (typeof r[h] === 'number') r[h] = Math.min(hi, Math.max(lo, r[h] as number)); });
    });
  }

  if (op === 'trim_spaces') {
    data.forEach(r => headers.forEach(h => { if (typeof r[h] === 'string') r[h] = (r[h] as string).trim(); }));
  }

  if (op === 'normalize') {
    headers.filter(h => types[h] === 'number').forEach(h => {
      const vals = data.map(r => Number(r[h])).filter(v => !isNaN(v));
      if (!vals.length) return;
      const min = Math.min(...vals), max = Math.max(...vals);
      if (max > min) {
        data.forEach(r => { if (typeof r[h] === 'number') r[h] = ((r[h] as number) - min) / (max - min); });
      }
    });
  }

  if (op === 'fix_types') {
    headers.forEach(h => {
      const type = types[h];
      data.forEach(r => {
        if (r[h] === null || r[h] === undefined || r[h] === '') return;
        if (type === 'number' && typeof r[h] !== 'number') {
          const parsed = Number(r[h]);
          r[h] = isNaN(parsed) ? null : parsed;
        } else if (type === 'boolean' && typeof r[h] !== 'boolean') {
          r[h] = String(r[h]).toLowerCase() === 'true';
        } else if (type === 'string' && typeof r[h] !== 'string') {
          r[h] = String(r[h]);
        }
      });
    });
  }

  return data;
}

// ─── DQ Score ────────────────────────────────────────────────────────────────
export function calcDQScore(rows: DataRow[], headers: string[], opsApplied: number): number {
  const total = rows.length * headers.length;
  const nulls = rows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);
  const completeness = (1 - nulls / total) * 100;
  const dupRatio = (new Set(rows.map(r => JSON.stringify(r))).size / rows.length) * 100;
  const opBonus = (opsApplied / 6) * 10;
  return Math.min(100, completeness * 0.5 + dupRatio * 0.4 + opBonus);
}

// ─── Number Formatter ────────────────────────────────────────────────────────
export function fmtNum(n: number): string {
  if (isNaN(n)) return '—';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

// ─── Box Plot Data ────────────────────────────────────────────────────────────
import { BoxPlotData } from './types';
export function calcBoxPlot(col: string, rows: DataRow[]): BoxPlotData {
  const nums = rows.map(r => Number(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
  const n = nums.length;
  const q1 = nums[Math.floor(n * 0.25)];
  const median = nums[Math.floor(n * 0.5)];
  const q3 = nums[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const mean = nums.reduce((a, b) => a + b, 0) / n;
  const outliers = nums.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
  return { col, min: nums[0] ?? 0, q1, median, q3, max: nums[n - 1] ?? 0, mean, outliers };
}

// ─── Drop Column ──────────────────────────────────────────────────────────────
export function dropColumn(col: string, headers: string[], rows: DataRow[]): { headers: string[]; rows: DataRow[] } {
  const newHeaders = headers.filter(h => h !== col);
  const newRows = rows.map(r => {
    const clone = { ...r };
    delete clone[col];
    return clone;
  });
  return { headers: newHeaders, rows: newRows };
}

// ─── Find & Replace ───────────────────────────────────────────────────────────
export function findReplace(col: string, find: string, replace: string, rows: DataRow[]): DataRow[] {
  return rows.map(r => ({
    ...r,
    [col]: typeof r[col] === 'string' ? (r[col] as string).replaceAll(find, replace) : r[col],
  }));
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
export function exportCSV(headers: string[], rows: DataRow[], filename = 'aether_export.csv') {
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([lines], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Frequency Map ────────────────────────────────────────────────────────────
export function freqMap(col: string, rows: DataRow[]): Record<string, number> {
  const freq: Record<string, number> = {};
  rows.forEach(r => { const k = String(r[col] ?? ''); freq[k] = (freq[k] || 0) + 1; });
  return freq;
}

// ─── Completeness % ───────────────────────────────────────────────────────────
export function completenessPercent(headers: string[], rows: DataRow[]): number {
  if (!rows.length || !headers.length) return 100;
  const total = rows.length * headers.length;
  const nulls = rows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);
  return parseFloat(((1 - nulls / total) * 100).toFixed(1));
}

// ─── Pearson Correlation ──────────────────────────────────────────────────────
export function calcPearsonCorrelation(colA: string, colB: string, rows: DataRow[]): number {
  const valid = rows.map(r => ({ x: Number(r[colA]), y: Number(r[colB]) })).filter(r => !isNaN(r.x) && !isNaN(r.y));
  if (valid.length === 0) return 0;
  const meanX = valid.reduce((a, b) => a + b.x, 0) / valid.length;
  const meanY = valid.reduce((a, b) => a + b.y, 0) / valid.length;
  
  let num = 0, denX = 0, denY = 0;
  for (const p of valid) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return denX === 0 || denY === 0 ? 0 : num / Math.sqrt(denX * denY);
}

// ─── A/B Test Simulator (Welch's T-Test Approximation) ────────────────────────
export function simulateABTest(targetCol: string, groupCol: string, controlVal: string, variantVal: string, rows: DataRow[]) {
  const control = rows.filter(r => String(r[groupCol]) === controlVal).map(r => Number(r[targetCol])).filter(v => !isNaN(v));
  const variant = rows.filter(r => String(r[groupCol]) === variantVal).map(r => Number(r[targetCol])).filter(v => !isNaN(v));

  if (control.length < 2 || variant.length < 2) return { pValue: 1, diff: 0, significant: false, controlMean: 0, variantMean: 0 };

  const meanC = control.reduce((a, b) => a + b, 0) / control.length;
  const meanV = variant.reduce((a, b) => a + b, 0) / variant.length;
  const varC = control.reduce((a, b) => a + Math.pow(b - meanC, 2), 0) / (control.length - 1);
  const varV = variant.reduce((a, b) => a + Math.pow(b - meanV, 2), 0) / (variant.length - 1);

  const tStat = (meanV - meanC) / Math.sqrt(varC / control.length + varV / variant.length);
  
  // Approximate p-value for a 2-tailed test (simplified normal approximation)
  const z = Math.abs(tStat);
  const pValue = 2 * (1 - (1 / (1 + Math.exp(-1.702 * z)))); // Logistic approximation to normal CDF
  
  return {
    controlMean: meanC,
    variantMean: meanV,
    diff: meanV - meanC,
    pValue,
    significant: pValue < 0.05
  };
}

// ─── Statistical Correlation Methods ─────────────────────────────────────────

export function findTopCorrelations(rows: DataRow[], numCols: string[]): {col1: string, col2: string, score: number}[] {
  const pairs: {col1: string, col2: string, score: number}[] = [];
  if (numCols.length < 2) return pairs;
  
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const score = calcPearsonCorrelation(numCols[i], numCols[j], rows);
      if (!isNaN(score) && Math.abs(score) > 0.5) { // Only keep interesting correlations
        pairs.push({ col1: numCols[i], col2: numCols[j], score });
      }
    }
  }
  
  // Sort by highest absolute correlation first
  return pairs.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 5); // top 5
}

// ─── Custom Formula Engine ───────────────────────────────────────────────────
export function applyCustomFormula(rows: DataRow[], headers: string[], newColName: string, formula: string): DataRow[] {
  // Very basic safe parser. Replaces column names in the formula with r['colName']
  // Requires columns to be alphanumeric for safety in this basic version.
  return rows.map(r => {
    let result = null;
    try {
      // Build function arguments and values
      const args = headers.map(h => h.replace(/[^a-zA-Z0-9_]/g, ''));
      const vals = headers.map(h => r[h] === null ? 0 : Number(r[h]) || r[h]);
      
      // Attempt to evaluate expression
      // We sanitize the headers for variable names but map them properly
      let safeFormula = formula;
      headers.forEach((h, i) => {
         const safeH = args[i];
         if (safeH) {
           // Regex replace word bounds to substitute variable
           const regex = new RegExp(`\\b${safeH}\\b`, 'g');
           safeFormula = safeFormula.replace(regex, `args[${i}]`);
         }
      });
      
      const fn = new Function('args', `return ${safeFormula};`);
      result = fn(vals);
      if (typeof result === 'number' && isNaN(result)) result = null;
    } catch (e) {
      result = null; // Ignore errors per row
    }
    return { ...r, [newColName]: result };
  });
}

// ─── Statistical Anomaly Detection ────────────────────────────────────────────
export function detectAnomalies(rows: DataRow[], types: Record<string, ColumnType>): number[] {
  const anomalyRowIndices = new Set<number>();
  
  Object.keys(types).filter(h => types[h] === 'number').forEach(h => {
    const nums = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
    if (nums.length === 0) return;
    
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const std = Math.sqrt(nums.reduce((a, v) => a + (v - mean) ** 2, 0) / nums.length);
    
    if (std === 0) return;
    
    rows.forEach((r, idx) => {
      const val = Number(r[h]);
      if (!isNaN(val) && Math.abs(val - mean) > 3 * std) {
        anomalyRowIndices.add(idx);
      }
    });
  })
  
  return Array.from(anomalyRowIndices);
}

// ─── Data Contracts Validation ───────────────────────────────────────────────
import { DataContractRule } from './types';

export function validateDataContract(rows: DataRow[], rules: DataContractRule[]): { valid: DataRow[], quarantined: DataRow[] } {
  if (!rules || rules.length === 0) return { valid: rows, quarantined: [] };

  const valid: DataRow[] = [];
  const quarantined: DataRow[] = [];

  for (const r of rows) {
    let isValid = true;
    for (const rule of rules) {
      const val = r[rule.column];
      
      if (rule.operator === 'not_null') {
        if (val === null || val === undefined || val === '') isValid = false;
      } else if (rule.operator === '==') {
        if (String(val) !== String(rule.value)) isValid = false;
      } else if (rule.operator === '!=') {
        if (String(val) === String(rule.value)) isValid = false;
      } else if (rule.operator === 'contains') {
        if (val === null || val === undefined || !String(val).includes(String(rule.value))) isValid = false;
      } else if (rule.operator === '>') {
        if (Number(val) <= Number(rule.value) || isNaN(Number(val))) isValid = false;
      } else if (rule.operator === '<') {
        if (Number(val) >= Number(rule.value) || isNaN(Number(val))) isValid = false;
      }

      if (!isValid) break;
    }

    if (isValid) {
      valid.push(r);
    } else {
      quarantined.push(r);
    }
  }

  return { valid, quarantined };
}

// ─── Version Control Diffing ─────────────────────────────────────────────────
export interface DiffItem {
  type: 'added' | 'deleted' | 'modified' | 'unchanged';
  row: DataRow;
  changes?: Record<string, { old: any; new: any }>;
}

export function calculateDataDiff(oldRows: DataRow[], newRows: DataRow[]): DiffItem[] {
  // Simplistic MVP Diff: compares by row stringification.
  // In a real app, we'd use a primary key or more robust matching.
  const oldSet = new Map(oldRows.map(r => [JSON.stringify(r), r]));
  const newSet = new Map(newRows.map(r => [JSON.stringify(r), r]));

  const diff: DiffItem[] = [];

  for (const newRow of newRows) {
    const newHash = JSON.stringify(newRow);
    if (oldSet.has(newHash)) {
      diff.push({ type: 'unchanged', row: newRow });
    } else {
      diff.push({ type: 'added', row: newRow });
    }
  }

  for (const oldRow of oldRows) {
    const oldHash = JSON.stringify(oldRow);
    if (!newSet.has(oldHash)) {
      diff.push({ type: 'deleted', row: oldRow });
    }
  }

  return diff;
}

// ─── Export to Code ───────────────────────────────────────────────────────────
export function generatePythonCode(appliedOps: string[], filename: string): string {
  let code = `import pandas as pd\nimport numpy as np\n\n# Aether DataOps - Generated Pipeline\n# Load Data\ndf = pd.read_csv('${filename}')\n\n`;
  
  appliedOps.forEach(op => {
    if (op === 'remove_dups') code += `df = df.drop_duplicates()\n`;
    else if (op === 'fill_nulls') code += `df = df.fillna(df.median(numeric_only=True)).fillna('Unknown')\n`;
    else if (op === 'drop_nulls') code += `df = df.dropna()\n`;
    else if (op === 'trim_spaces') code += `df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)\n`;
    else if (op === 'normalize') code += `for col in df.select_dtypes(include=np.number).columns:\n    df[col] = (df[col] - df[col].min()) / (df[col].max() - df[col].min())\n`;
    else if (op === 'cap_outliers') {
      code += `\n# Cap Outliers (IQR method)\nfor col in df.select_dtypes(include=np.number).columns:\n    Q1 = df[col].quantile(0.25)\n    Q3 = df[col].quantile(0.75)\n    IQR = Q3 - Q1\n    df[col] = np.clip(df[col], Q1 - 1.5 * IQR, Q3 + 1.5 * IQR)\n`;
    }
    else if (op.startsWith('drop_col:')) {
      const col = op.split(':')[1];
      code += `df = df.drop(columns=['${col}'])\n`;
    }
    else if (op.startsWith('find_replace:')) {
      const [_, col, find, replace] = op.split(':');
      code += `df['${col}'] = df['${col}'].astype(str).str.replace('${find}', '${replace}', regex=False)\n`;
    }
    else if (op.startsWith('custom_formula:')) {
      const [_, col, formula] = op.split(':');
      code += `df['${col}'] = df.eval('${formula}')\n`;
    }
  });
  
  code += `\n# Export Cleaned Data\ndf.to_csv('cleaned_${filename}', index=False)\n`;
  return code;
}

// ─── Interactive Pivot Tables ─────────────────────────────────────────────────
export function aggregatePivotTable(rows: DataRow[], rowCol: string, colCol: string, valCol: string, aggType: 'sum'|'count'|'avg'): Record<string, Record<string, number>> {
  const pivot: Record<string, Record<string, { sum: number, count: number }>> = {};
  
  rows.forEach(r => {
    const rowVal = String(r[rowCol] ?? 'Unknown');
    const colVal = String(r[colCol] ?? 'Unknown');
    const val = Number(r[valCol]);
    
    if (!pivot[rowVal]) pivot[rowVal] = {};
    if (!pivot[rowVal][colVal]) pivot[rowVal][colVal] = { sum: 0, count: 0 };
    
    if (!isNaN(val)) {
      pivot[rowVal][colVal].sum += val;
      pivot[rowVal][colVal].count += 1;
    }
  });

  // Finalize aggregation
  const result: Record<string, Record<string, number>> = {};
  Object.keys(pivot).forEach(r => {
    result[r] = {};
    Object.keys(pivot[r]).forEach(c => {
      const stats = pivot[r][c];
      if (aggType === 'sum') result[r][c] = stats.sum;
      else if (aggType === 'count') result[r][c] = stats.count;
      else if (aggType === 'avg') result[r][c] = stats.count > 0 ? stats.sum / stats.count : 0;
    });
  });
  
  return result;
}

export function splitQuarantine(headers: string[], rows: DataRow[]): { cleanRows: DataRow[], quarantinedRows: DataRow[] } {
  const cleanRows: DataRow[] = [];
  const quarantinedRows: DataRow[] = [];

  rows.forEach(row => {
    let nullCount = 0;
    headers.forEach(h => {
      const val = row[h];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        nullCount++;
      }
    });

    if (nullCount > 0) {
      quarantinedRows.push(row);
    } else {
      cleanRows.push(row);
    }
  });

  return { cleanRows, quarantinedRows };
}
