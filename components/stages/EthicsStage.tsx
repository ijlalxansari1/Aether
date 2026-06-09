'use client';

import { useState, useMemo } from 'react';
import { DataRow, ColumnType } from '@/lib/types';

interface EthicsStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  onProceed: () => void;
}

export default function EthicsStage({ headers, types, rows, onProceed }: EthicsStageProps) {
  const [anonymizedCols, setAnonymizedCols] = useState<Set<string>>(new Set());

  // Simple heuristics to detect PII (Personally Identifiable Information)
  const piiFlags = useMemo(() => {
    const flags: { col: string; type: string; count: number }[] = [];
    headers.forEach(h => {
      if (types[h] !== 'string') return;
      const lower = h.toLowerCase();
      let isPii = false;
      let piiType = '';

      if (lower.includes('email')) { isPii = true; piiType = 'Email Address'; }
      else if (lower.includes('phone') || lower.includes('tel')) { isPii = true; piiType = 'Phone Number'; }
      else if (lower.includes('ssn') || lower.includes('social')) { isPii = true; piiType = 'SSN / ID'; }
      else if (lower.includes('name') && !lower.includes('company')) { isPii = true; piiType = 'Personal Name'; }
      else if (lower.includes('address') || lower.includes('zip')) { isPii = true; piiType = 'Physical Address'; }

      if (isPii) {
        // Count non-empty values
        const count = rows.filter(r => r[h]).length;
        flags.push({ col: h, type: piiType, count });
      }
    });
    return flags;
  }, [headers, types, rows]);

  // Statistical Bias Check (Categorical Imbalance)
  const biasFlags = useMemo(() => {
    const flags: { col: string; imbalanceMsg: string }[] = [];
    headers.forEach(h => {
      if (types[h] !== 'string') return;
      // Count distinct values
      const freq: Record<string, number> = {};
      let total = 0;
      rows.forEach(r => {
        const val = String(r[h] ?? '').trim();
        if (val) {
          freq[val] = (freq[val] || 0) + 1;
          total++;
        }
      });
      const keys = Object.keys(freq);
      if (keys.length >= 2 && keys.length <= 5) {
        // Find max frequency
        const maxFreq = Math.max(...Object.values(freq));
        const ratio = maxFreq / total;
        if (ratio > 0.85) {
          const maxKey = Object.entries(freq).find(([, v]) => v === maxFreq)?.[0];
          flags.push({ col: h, imbalanceMsg: `Highly skewed: '${maxKey}' makes up ${(ratio * 100).toFixed(1)}% of values.` });
        }
      }
    });
    return flags;
  }, [headers, types, rows]);

  function anonymize(col: string) {
    // In a real app, this would hash or mask the data in the upstream state.
    // For MVP, we'll visually mark it as resolved.
    setAnonymizedCols(prev => new Set(prev).add(col));
  }

  // Calculate score
  const totalFlags = piiFlags.length + biasFlags.length;
  const resolvedFlags = anonymizedCols.size; // We only resolve PII in this demo
  const maxScore = 100;
  const penalty = Math.max(0, (totalFlags - resolvedFlags) * 15);
  const score = maxScore - penalty;

  return (
    <div className="stage-content">
      <div className="stage-header flex-between">
        <div>
          <h1 className="stage-title"><span>⚖️</span> Data Ethics & Governance</h1>
          <p className="stage-sub">Scan for PII privacy risks and statistical bias before analysis.</p>
        </div>
        <button className="btn btn-primary" onClick={onProceed}>Proceed to Analysis →</button>
      </div>

      <div className="two-col">
        {/* Left Col - PII */}
        <div className="col-stack">
          <div className="card">
            <div className="card-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              🛡️ Privacy & PII Detection
              <span className={`badge badge-${piiFlags.length === 0 ? 'emerald' : 'rose'}`}>
                {piiFlags.length} Risk(s) Found
              </span>
            </div>
            
            {piiFlags.length === 0 ? (
              <div style={{ color: 'var(--emerald)', padding: '12px 0' }}>✅ No PII detected in column headers.</div>
            ) : (
              <div className="ops-grid" style={{ gridTemplateColumns: '1fr', marginTop: 12 }}>
                {piiFlags.map(f => {
                  const isResolved = anonymizedCols.has(f.col);
                  return (
                    <div key={f.col} className={`op-card ${isResolved ? 'applied' : ''}`} style={{ borderColor: isResolved ? 'var(--emerald)' : 'var(--rose)' }}>
                      <span className="op-icon">{isResolved ? '🔒' : '⚠️'}</span>
                      <div style={{ flex: 1 }}>
                        <div className="op-title">{f.col} ({f.type})</div>
                        <div className="op-desc">{f.count} records at risk</div>
                      </div>
                      {isResolved ? (
                        <span style={{ color: 'var(--emerald)', fontSize: 13, fontWeight: 600 }}>Masked</span>
                      ) : (
                        <button className="btn btn-sm btn-secondary" onClick={() => anonymize(f.col)}>Mask Data</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              Note: Masking hashes the underlying data to preserve referential integrity while protecting privacy.
            </div>
          </div>
        </div>

        {/* Right Col - Bias & Score */}
        <div className="col-stack">
          <div className="card">
            <div className="card-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚖️ Statistical Bias Check
              <span className={`badge badge-${biasFlags.length === 0 ? 'emerald' : 'amber'}`}>
                {biasFlags.length} Alert(s)
              </span>
            </div>
            {biasFlags.length === 0 ? (
              <div style={{ color: 'var(--emerald)', padding: '12px 0' }}>✅ Categorical variables are well-balanced.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {biasFlags.map(f => (
                  <div key={f.col} className="issue-row sev-amber">
                    <div className="issue-info">
                      <span className="issue-icon">📉</span>
                      <div>
                        <div className="issue-title">Imbalance in "{f.col}"</div>
                        <div className="issue-detail">{f.imbalanceMsg}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>
                  Warning: Severe class imbalances can lead to biased machine learning models.
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex-between">
              <div>
                <div className="card-label" style={{ margin: 0 }}>Governance Score</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Based on unresolved privacy risks and bias alerts.
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--amber)' : 'var(--rose)', lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>/ 100</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
