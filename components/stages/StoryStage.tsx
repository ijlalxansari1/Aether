'use client';

import { ColProfile, ColumnType, DataRow } from '@/lib/types';
import { profileColumn, calcDQScore } from '@/lib/dataUtils';

interface StoryStageProps {
  headers: string[];
  types: Record<string, ColumnType>;
  rows: DataRow[];
  appliedOps: Set<string>;
  onProceed: () => void;
}

export default function StoryStage({ headers, types, rows, appliedOps, onProceed }: StoryStageProps) {
  const numCols = headers.filter(h => types[h] === 'number');
  const strCols = headers.filter(h => types[h] === 'string');
  const profiles: ColProfile[] = headers.map(h => profileColumn(h, types[h], rows));
  const nullCount = rows.reduce((a, r) => a + headers.filter(h => r[h] === null || r[h] === undefined || r[h] === '').length, 0);
  const completeness = (((rows.length * headers.length - nullCount) / (rows.length * headers.length)) * 100).toFixed(1);
  const dqScore = calcDQScore(rows, headers, appliedOps.size);

  const insights = profiles.map(p => ({
    title: `${p.name} Breakdown`,
    body: p.type === 'number'
      ? `<strong>${p.name}</strong> spans <strong>${p.min?.toFixed(1)} → ${p.max?.toFixed(1)}</strong> with a mean of <strong>${p.mean?.toFixed(2)}</strong> and std dev of <strong>${p.std?.toFixed(2)}</strong>. Median sits at <strong>${p.median?.toFixed(2)}</strong>.`
      : `<strong>${p.name}</strong> has <strong>${p.unique}</strong> distinct values. The dominant category is <strong>"${p.topValue}"</strong>, appearing ${p.topFreq} times (<strong>${rows.length ? ((p.topFreq! / rows.length) * 100).toFixed(1) : 0}%</strong> of records).`,
  }));

  const numRange = numCols.map(h => {
    const p = profiles.find(pr => pr.name === h)!;
    return `<strong>${h}</strong>: ${p.min?.toFixed(0)}–${p.max?.toFixed(0)}`;
  }).join(', ');

  const qualityLabel = +completeness >= 90 ? 'excellent' : +completeness >= 70 ? 'moderate' : 'low';

  return (
    <div className="stage-content">
      <div className="stage-header flex-between">
        <div>
          <h1 className="stage-title"><span>📖</span> Data Story</h1>
          <p className="stage-sub">Auto-generated narrative — key findings, patterns, and business context from your dataset.</p>
        </div>
        <button className="btn btn-primary" onClick={onProceed}>View Dashboard →</button>
      </div>

      {/* Hero story card */}
      <div className="story-hero">
        <h2 className="story-headline">
          Your data tells a story of{' '}
          <span className="gradient-text">{rows.length} records</span>
          {' '}across{' '}
          <span className="gradient-text">{headers.length} dimensions</span>
        </h2>

        <div className="story-body">
          <p>
            This dataset, ingested into Aether&apos;s DataOps pipeline, contains <strong>{rows.length} rows</strong> and{' '}
            <strong>{headers.length} columns</strong> spanning <strong>{numCols.length} numeric</strong> and{' '}
            <strong>{strCols.length} categorical</strong> dimensions. Data completeness stands at{' '}
            <strong>{completeness}%</strong> — a <em>{qualityLabel}</em> signal quality score.
          </p>
          <p>
            <strong>{appliedOps.size}</strong> cleaning operations were applied to standardize and improve the data.
            The pipeline detected and resolved missing values, duplicates, and potential outliers, ensuring downstream
            analytics are grounded in trustworthy data. Final Data Quality Score:{' '}
            <strong style={{ color: dqScore >= 80 ? 'var(--emerald)' : 'var(--amber)' }}>{dqScore.toFixed(0)}%</strong>.
          </p>
          {numCols.length > 0 && (
            <p dangerouslySetInnerHTML={{ __html: `Key numeric signals: ${numRange}. These distributions form the analytical substrate for dashboard metrics.` }} />
          )}
        </div>

        <div className="insight-pills">
          {[
            `📊 ${rows.length} records`,
            `🧹 ${appliedOps.size} ops applied`,
            `✅ ${completeness}% complete`,
            `🔢 ${numCols.length} numeric`,
            `🏷 ${strCols.length} categorical`,
            `🎯 DQ Score: ${dqScore.toFixed(0)}%`,
          ].map(t => <span key={t} className="insight-pill">{t}</span>)}
        </div>
      </div>

      {/* Per-column findings */}
      <div className="finding-grid">
        {insights.slice(0, 6).map((ins, i) => (
          <div key={i} className="finding-card">
            <h4>📌 {ins.title}</h4>
            <p dangerouslySetInnerHTML={{ __html: ins.body }} />
          </div>
        ))}
      </div>
    </div>
  );
}
