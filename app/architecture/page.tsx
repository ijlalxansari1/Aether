'use client';

import { useState } from 'react';
import GlobalSidebar from '@/components/GlobalSidebar';

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'engineering' | 'paths' | 'unified'>('overview');
  const [activePath, setActivePath] = useState<'analyst' | 'bi' | 'scientist'>('analyst');
  const [expandedDE, setExpandedDE] = useState<string | null>(null);

  const deModules = [
    {
      id: 'extract',
      name: '1. Extract (Ingest)',
      does: 'Connects to enterprise databases, local CSVs, REST APIs, and PDF documents to ingest raw data.',
      tools: 'API Connectors, CSV Parser, Mock PDF OCR Extractor.',
      ethics: 'Auto-scans for unencrypted PII. Logs the exact origin, timestamp, and user who triggered the ingestion.',
      output: 'An array of IngestedDataset objects {id, name, headers, rows} added to the pipeline state.'
    },
    {
      id: 'load',
      name: '2. Load (Warehouse Mount)',
      does: 'Mounts all heterogeneous datasets into an in-memory SQL warehouse for high-performance querying.',
      tools: 'DuckDB WASM Engine.',
      ethics: 'Data remains strictly in-memory. No raw data is ever persisted to external disk without explicit encryption and logging.',
      output: 'In-memory SQL tables (t1, t2, t3) ready for relational operations.'
    },
    {
      id: 'transform',
      name: '3. Transform (SQL Merge)',
      does: 'Merges multiple tables using SQL joins and unions to create a single unified baseline dataset.',
      tools: 'Advanced SQL Editor, Visual No-Code Merge Builder.',
      ethics: 'Transformations are permanently logged into the Data Lineage manifest. Lossy transformations require user confirmation.',
      output: 'A single, unified DataRow[] array and updated DataSchema array representing the primary pipeline dataset.'
    },
    {
      id: 'clean',
      name: '4. Clean & Normalize',
      does: 'Detects quality issues (nulls, outliers, duplicates) and applies bulk or targeted data cleaning operations.',
      tools: 'Heuristic Issue Detector, Outlier Capping Algorithm, Type Inferencer.',
      ethics: 'Imputation logic strictly logged. Dropped rows are preserved in an audit table to prevent silent data loss.',
      output: 'A sanitized DataRow[] array passed to the Ethics gateway.'
    },
    {
      id: 'analyze',
      name: '5. Analyze (BI & Stats)',
      does: 'Generates statistical profiles and renders interactive charts (distribution, scatter, boxplot, correlation).',
      tools: 'Chart.js, Correlation Engine, Statistical Profiler.',
      ethics: 'Bias detection is enforced prior to visualization. Demographic proxy columns are flagged.',
      output: 'Visual chart canvases and statistical KPI metrics ready for the Dashboard.'
    },
    {
      id: 'report',
      name: '6. Report & Output',
      does: 'Compiles the pipeline history, visualizations, and clean data into a shareable, exportable artifact.',
      tools: 'Report Generator, CSV Exporter, JSON Config Builder.',
      ethics: 'Attaches an immutable "Ethics Certificate" to the final report guaranteeing it passed all governance checks.',
      output: 'A downloadable CSV, PDF summary, and JSON Pipeline Manifest.'
    }
  ];

  const paths = {
    analyst: [
      { step: 'Extract', desc: 'Pull from Local CSV or Salesforce API.' },
      { step: 'Load/Transform', desc: 'Use Visual Builder to Left Join sales data with leads.' },
      { step: 'Clean', desc: 'Auto-fill null values in revenue column.' },
      { step: 'Analyze', desc: 'Run DuckDB SQL to aggregate revenue by quarter.' },
      { step: 'Output', desc: 'Export cleaned CSV for external stakeholder.' },
      { statement: 'OUTPUT: A perfectly clean, enriched CSV file with full audit lineage.' }
    ],
    bi: [
      { step: 'Extract', desc: 'Connect to Snowflake Enterprise DB.' },
      { step: 'Transform', desc: 'Write Advanced SQL to build a star schema.' },
      { step: 'Analyze', desc: 'Generate scatter plots and correlation matrices.' },
      { step: 'Story', desc: 'Use AI Copilot to generate automated narrative insights.' },
      { step: 'Dashboard', desc: 'Publish interactive charts.' },
      { statement: 'OUTPUT: A live, shareable interactive dashboard with AI-generated narratives.' }
    ],
    scientist: [
      { step: 'Extract', desc: 'Ingest raw logs and PDF documents.' },
      { step: 'Clean', desc: 'Normalize numeric distributions and drop outliers.' },
      { step: 'Ethics', desc: 'Run rigorous bias detection on training features.' },
      { step: 'Analyze', desc: 'Extract statistical profiles and correlation weights.' },
      { step: 'Output', desc: 'Generate JSON manifest and model training dataset.' },
      { statement: 'OUTPUT: A bias-certified, mathematically normalized training dataset ready for ML ingestion.' }
    ]
  };

  const unifiedLayer = [
    { title: 'Encryption at Rest/Transit', icon: '🔒', desc: 'All data is encrypted via AES-256 before hitting persistent storage.' },
    { title: 'Audit Logging', icon: '📜', desc: 'Every SQL query, click, and export is permanently logged.' },
    { title: 'RBAC Access Control', icon: '🔑', desc: 'Strict persona-based permissions ensure Analysts cannot bypass Ethics.' },
    { title: 'Ethics Certification', icon: '🎖️', desc: 'Final reports cannot be exported without a passing bias/PII scan.' },
    { title: 'Data Lineage', icon: '🧬', desc: 'A cryptographic hash chain tracks every transformation back to the raw source.' },
    { title: 'Auto-Anonymization', icon: '🕵️', desc: 'Detected PII (emails, SSNs) is automatically masked.' },
    { title: 'Bias Detection', icon: '⚖️', desc: 'Statistical variance checks identify proxy discrimination in datasets.' },
    { title: 'Model Guardrails', icon: '🛡️', desc: 'AI Copilot narrative outputs are filtered for hallucination and toxicity.' }
  ];

  return (
    <div className="app-layout">
      <GlobalSidebar />
      <div className="app-root" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', overflowY: 'auto' }}>
        
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Platform Architecture Reference</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            A comprehensive, interactive blueprint of the AETHER platform. Ethics and governance are structural—baked into the pipeline as immutable gates.
          </p>
        </header>

        <div className="chart-tabs" style={{ marginBottom: '30px' }}>
          <button className={`chart-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>🗺️ Full Overview</button>
          <button className={`chart-tab ${activeTab === 'engineering' ? 'active' : ''}`} onClick={() => setActiveTab('engineering')}>⚙️ Data Engineering</button>
          <button className={`chart-tab ${activeTab === 'paths' ? 'active' : ''}`} onClick={() => setActiveTab('paths')}>🛣️ 3 Paths</button>
          <button className={`chart-tab ${activeTab === 'unified' ? 'active' : ''}`} onClick={() => setActiveTab('unified')}>🛡️ Unified Layer</button>
        </div>

        <main style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', minHeight: '500px' }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>AETHER System Map</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div 
                  style={{ padding: '24px', border: '2px solid var(--border)', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-surface)' }}
                  onClick={() => setActiveTab('engineering')}
                  className="hover-card"
                >
                  <h3 style={{ color: 'var(--cyan)', marginBottom: '8px' }}>1. Data Engineering Pipeline</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Extract → Load → Transform → Clean → Analyze → Report. (Click to explore the 6 modules)</p>
                </div>

                <div 
                  style={{ padding: '24px', border: '2px solid var(--border)', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-surface)' }}
                  onClick={() => setActiveTab('paths')}
                  className="hover-card"
                >
                  <h3 style={{ color: 'var(--violet)', marginBottom: '8px' }}>2. Persona Paths</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Data Analyst | BI Engineer | Data Scientist. Custom workflows on top of the shared engine. (Click to explore)</p>
                </div>

                <div 
                  style={{ padding: '24px', border: '2px solid var(--border)', borderRadius: '12px', cursor: 'pointer', background: 'var(--bg-surface)' }}
                  onClick={() => setActiveTab('unified')}
                  className="hover-card"
                >
                  <h3 style={{ color: 'var(--emerald)', marginBottom: '8px' }}>3. Unified Governance Layer</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>The foundational ethics and security bedrock that all pipelines run through. (Click to explore)</p>
                </div>
              </div>
            </div>
          )}

          {/* DATA ENGINEERING TAB */}
          {activeTab === 'engineering' && (
            <div className="engineering-tab">
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Data Engineering Modules</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deModules.map(mod => (
                  <div key={mod.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div 
                      style={{ padding: '16px', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => setExpandedDE(expandedDE === mod.id ? null : mod.id)}
                    >
                      <h3 style={{ fontSize: '16px', margin: 0 }}>{mod.name}</h3>
                      <span>{expandedDE === mod.id ? '▼' : '▶'}</span>
                    </div>
                    {expandedDE === mod.id && (
                      <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: '16px' }}><strong>What it does:</strong> <span style={{ color: 'var(--text-secondary)'}}>{mod.does}</span></div>
                        <div style={{ marginBottom: '16px' }}><strong>Tools inside:</strong> <span style={{ color: 'var(--text-secondary)'}}>{mod.tools}</span></div>
                        <div style={{ marginBottom: '16px', color: 'var(--emerald)' }}><strong>Ethics/Audit Behavior:</strong> {mod.ethics}</div>
                        <div style={{ padding: '12px', background: 'rgba(0,212,255,0.05)', borderLeft: '3px solid var(--cyan)', color: 'var(--cyan)' }}>
                          <strong>Exact Output:</strong> {mod.output}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PATHS TAB */}
          {activeTab === 'paths' && (
            <div className="paths-tab">
              <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Persona Paths</h2>
              
              <div className="chart-tabs" style={{ marginBottom: '24px' }}>
                <button className={`chart-tab ${activePath === 'analyst' ? 'active' : ''}`} onClick={() => setActivePath('analyst')}>📊 Data Analyst</button>
                <button className={`chart-tab ${activePath === 'bi' ? 'active' : ''}`} onClick={() => setActivePath('bi')}>📈 BI Engineer</button>
                <button className={`chart-tab ${activePath === 'scientist' ? 'active' : ''}`} onClick={() => setActivePath('scientist')}>🧪 Data Scientist</button>
              </div>

              <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {/* Timeline vertical line */}
                  <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '80px', width: '2px', background: 'var(--border)' }} />
                  
                  {paths[activePath].map((item, idx) => {
                    if (item.statement) {
                      return (
                        <div key={idx} style={{ marginTop: '24px', padding: '16px', background: 'rgba(124,58,237,0.1)', border: '1px solid var(--violet)', borderRadius: '8px', color: 'var(--violet)', fontWeight: 600, textAlign: 'center' }}>
                          {item.statement}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {idx + 1}
                        </div>
                        <div style={{ paddingTop: '6px' }}>
                          <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{item.step}</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* UNIFIED LAYER TAB */}
          {activeTab === 'unified' && (
            <div className="unified-tab">
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Unified Governance Layer</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                These cross-cutting concerns are structurally embedded. You cannot build a model or publish a dashboard without passing through these gates.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {unifiedLayer.map((item, idx) => (
                  <div key={idx} style={{ padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                    <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
