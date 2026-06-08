import { ColumnType, DataRow, ColProfile, QualityIssue } from './types';

// ─── Type Inference ──────────────────────────────────────────────────────────
export function inferType(values: unknown[]): ColumnType {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (!nonNull.length) return 'string';
  if (nonNull.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean';
  if (nonNull.every(v => typeof v === 'number' && !isNaN(v as number))) return 'number';
  if (nonNull.every(v => typeof v === 'string' && !isNaN(Date.parse(v as string)) && (v as string).includes('-'))) return 'date';
  return 'string';
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
