/**
 * ─── Aether Data Understanding Engine ────────────────────────────────────────
 * 
 * The intelligence layer. Inspects a dataset and produces a DataUnderstanding
 * object that every downstream component consumes.
 * 
 * Philosophy: "Data should adapt the workflow — not the workflow constrain the data."
 * 
 * Pipeline: Observe → Understand → Reason → Recommend
 */

import {
  DataRow, ColumnType, ColProfile, SemanticType, BusinessDomain,
  ColumnUnderstanding, DataUnderstanding, AetherRecommendation, AetherWarning,
  DerivableMetric, DataRelationship, DataAnomaly
} from './types';
import { inferTypes, profileColumn, isPII, calcPearsonCorrelation, isEmptyValue } from './dataUtils';

// ─── Semantic Type Inference ─────────────────────────────────────────────────

const ID_PATTERNS = /^(id|_id|uuid|guid|key|code|sku|order_?id|customer_?id|user_?id|patient_?id|employee_?id|product_?id|transaction_?id|record_?id|invoice_?id|ticket_?id)$/i;
const TEMPORAL_PATTERNS = /^(date|time|timestamp|created_?at|updated_?at|modified_?at|order_?date|admission_?date|discharge_?date|hire_?date|start_?date|end_?date|birth_?date|dob|year|month|day|quarter|week)$/i;
const CURRENCY_PATTERNS = /^(price|cost|revenue|amount|salary|wage|income|fee|total|subtotal|tax|discount|balance|payment|unit_?price|net_?amount|gross_?amount)$/i;
const PERCENTAGE_PATTERNS = /^(rate|ratio|percent|pct|percentage|margin|growth|yield|efficiency|conversion|bounce|churn)$/i;
const GEO_PATTERNS = /^(country|city|state|region|zip|postal|lat|lng|latitude|longitude|address|location|province|county|district|territory)$/i;
const NAME_PATTERNS = /^(name|first_?name|last_?name|full_?name|display_?name|username|patient_?name|customer_?name|employee_?name)$/i;
const EMAIL_PATTERNS = /^(email|e_?mail|email_?address|contact_?email)$/i;
const PHONE_PATTERNS = /^(phone|telephone|mobile|cell|fax|contact_?number|phone_?number)$/i;

function inferSemanticType(colName: string, type: ColumnType, values: (string | number | boolean | null)[]): SemanticType {
  const name = colName.toLowerCase().replace(/[\s-]/g, '_');

  // Check name patterns first
  if (EMAIL_PATTERNS.test(name)) return 'email';
  if (PHONE_PATTERNS.test(name)) return 'phone';
  if (NAME_PATTERNS.test(name)) return 'name';
  if (ID_PATTERNS.test(name) || name.endsWith('_id') || name.endsWith('id')) return 'identifier';
  if (TEMPORAL_PATTERNS.test(name) || type === 'date') return 'temporal';
  if (CURRENCY_PATTERNS.test(name)) return 'currency';
  if (PERCENTAGE_PATTERNS.test(name)) return 'percentage';
  if (GEO_PATTERNS.test(name)) return 'geo';

  // Check value patterns
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'unknown';

  // Email detection by value
  if (type === 'string') {
    const sample = nonNull.slice(0, 20);
    const emailCount = sample.filter(v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)).length;
    if (emailCount > sample.length * 0.5) return 'email';

    const phoneCount = sample.filter(v => typeof v === 'string' && /^\+?[0-9\s\-()]{7,15}$/.test(v)).length;
    if (phoneCount > sample.length * 0.5) return 'phone';
  }

  // Numeric classification
  if (type === 'number') {
    // Check if values look like currency (check column name hints)
    if (name.includes('price') || name.includes('cost') || name.includes('amount')) return 'currency';
    return 'measure';
  }

  // String cardinality analysis
  if (type === 'string') {
    const uniqueCount = new Set(nonNull).size;
    const cardinalityRatio = uniqueCount / nonNull.length;
    
    // Low cardinality = categorical/dimension
    if (uniqueCount <= 30 || cardinalityRatio < 0.1) return 'dimension';
    // High cardinality = likely text or identifier
    if (cardinalityRatio > 0.9) return 'text';
    return 'categorical';
  }

  if (type === 'boolean') return 'dimension';

  return 'unknown';
}

// ─── Business Domain Detection ───────────────────────────────────────────────

interface DomainSignature {
  domain: BusinessDomain;
  keywords: string[];
  minMatches: number;
}

const DOMAIN_SIGNATURES: DomainSignature[] = [
  {
    domain: 'ecommerce',
    keywords: ['order', 'product', 'customer', 'price', 'quantity', 'cart', 'sku', 'shipping', 'revenue', 'discount', 'invoice', 'purchase'],
    minMatches: 3
  },
  {
    domain: 'healthcare',
    keywords: ['patient', 'diagnosis', 'treatment', 'admission', 'discharge', 'prescription', 'medical', 'clinical', 'doctor', 'hospital', 'symptom', 'outcome', 'dosage'],
    minMatches: 3
  },
  {
    domain: 'finance',
    keywords: ['ticker', 'stock', 'open', 'close', 'volume', 'portfolio', 'interest', 'loan', 'credit', 'debit', 'transaction', 'account', 'balance', 'dividend'],
    minMatches: 3
  },
  {
    domain: 'hr',
    keywords: ['employee', 'department', 'salary', 'hire', 'position', 'manager', 'performance', 'leave', 'payroll', 'benefit', 'title', 'tenure'],
    minMatches: 3
  },
  {
    domain: 'marketing',
    keywords: ['campaign', 'click', 'impression', 'conversion', 'channel', 'lead', 'bounce', 'ctr', 'engagement', 'audience', 'segment', 'ad'],
    minMatches: 3
  },
  {
    domain: 'logistics',
    keywords: ['shipment', 'tracking', 'warehouse', 'delivery', 'route', 'carrier', 'freight', 'inventory', 'supply', 'dispatch'],
    minMatches: 3
  },
  {
    domain: 'education',
    keywords: ['student', 'grade', 'course', 'enrollment', 'teacher', 'school', 'semester', 'exam', 'score', 'gpa', 'class'],
    minMatches: 3
  },
  {
    domain: 'iot',
    keywords: ['sensor', 'device', 'reading', 'temperature', 'humidity', 'pressure', 'signal', 'telemetry', 'mqtt', 'payload'],
    minMatches: 3
  }
];

function detectDomain(headers: string[]): { domain: BusinessDomain; confidence: number } {
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
  
  let bestDomain: BusinessDomain = 'generic';
  let bestScore = 0;
  let bestTotal = 1;

  for (const sig of DOMAIN_SIGNATURES) {
    let matches = 0;
    for (const keyword of sig.keywords) {
      if (normalizedHeaders.some(h => h.includes(keyword))) {
        matches++;
      }
    }
    const score = matches / sig.keywords.length;
    if (matches >= sig.minMatches && score > bestScore) {
      bestScore = score;
      bestDomain = sig.domain;
      bestTotal = sig.keywords.length;
    }
  }

  return { domain: bestDomain, confidence: Math.min(bestScore * 2, 1) }; // Scale confidence
}

const DOMAIN_LABELS: Record<BusinessDomain, string> = {
  ecommerce: 'E-commerce / Sales',
  healthcare: 'Healthcare / Clinical',
  finance: 'Finance / Trading',
  hr: 'Human Resources',
  marketing: 'Marketing / Advertising',
  logistics: 'Logistics / Supply Chain',
  education: 'Education / Academic',
  iot: 'IoT / Sensor Data',
  generic: 'General Dataset'
};

export function getDomainLabel(domain: BusinessDomain): string {
  return DOMAIN_LABELS[domain] || 'General Dataset';
}

// ─── Derivable Metrics Detection ─────────────────────────────────────────────

function detectDerivableMetrics(
  schema: ColumnUnderstanding[],
  headers: string[],
  rows: DataRow[]
): DerivableMetric[] {
  const metrics: DerivableMetric[] = [];
  const colNames = headers.map(h => h.toLowerCase());

  // quantity × price → revenue
  const quantityCol = headers.find(h => /^(quantity|qty|units|count|num_?items)$/i.test(h));
  const priceCol = headers.find(h => /^(price|unit_?price|cost|rate|unit_?cost)$/i.test(h));
  if (quantityCol && priceCol) {
    const completeness = rows.filter(r => 
      r[quantityCol] !== null && r[quantityCol] !== '' && 
      r[priceCol] !== null && r[priceCol] !== ''
    ).length / rows.length;
    metrics.push({
      name: 'revenue',
      formula: `${quantityCol} × ${priceCol}`,
      reason: `${quantityCol} and ${priceCol} can produce a valid monetary measure.`,
      inputCompleteness: Math.round(completeness * 1000) / 10
    });
  }

  // discharge_date - admission_date → length_of_stay
  const admitCol = headers.find(h => /^(admission_?date|admit_?date|check_?in|start_?date)$/i.test(h));
  const dischargeCol = headers.find(h => /^(discharge_?date|release_?date|check_?out|end_?date)$/i.test(h));
  if (admitCol && dischargeCol) {
    const completeness = rows.filter(r =>
      r[admitCol] !== null && r[admitCol] !== '' &&
      r[dischargeCol] !== null && r[dischargeCol] !== ''
    ).length / rows.length;
    metrics.push({
      name: 'length_of_stay',
      formula: `${dischargeCol} − ${admitCol}`,
      reason: `Duration between ${admitCol} and ${dischargeCol} yields a meaningful time metric.`,
      inputCompleteness: Math.round(completeness * 1000) / 10
    });
  }

  // profit = revenue - cost
  const revenueCol = headers.find(h => /^(revenue|sales|income|total_?sales)$/i.test(h));
  const costCol = headers.find(h => /^(cost|expense|cogs|total_?cost)$/i.test(h));
  if (revenueCol && costCol) {
    const completeness = rows.filter(r =>
      r[revenueCol] !== null && r[revenueCol] !== '' &&
      r[costCol] !== null && r[costCol] !== ''
    ).length / rows.length;
    metrics.push({
      name: 'profit',
      formula: `${revenueCol} − ${costCol}`,
      reason: `Profit margin can be derived from ${revenueCol} and ${costCol}.`,
      inputCompleteness: Math.round(completeness * 1000) / 10
    });
  }

  return metrics;
}

// ─── Relationship Detection ──────────────────────────────────────────────────

function detectRelationships(headers: string[], rows: DataRow[], types: Record<string, ColumnType>): DataRelationship[] {
  const numCols = headers.filter(h => types[h] === 'number');
  if (numCols.length < 2) return [];

  const relationships: DataRelationship[] = [];

  // Pairwise correlations — limit to first 10 numeric columns for performance
  const cols = numCols.slice(0, 10);
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const corr = calcPearsonCorrelation(cols[i], cols[j], rows);
      if (Math.abs(corr) > 0.5) {
        relationships.push({
          col1: cols[i],
          col2: cols[j],
          type: 'correlation',
          strength: Math.round(corr * 100) / 100
        });
      }
    }
  }

  // Sort by absolute strength
  relationships.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
  return relationships.slice(0, 10); // Top 10
}

// ─── Anomaly Detection ───────────────────────────────────────────────────────

function detectAnomalies(headers: string[], rows: DataRow[], types: Record<string, ColumnType>): DataAnomaly[] {
  const anomalies: DataAnomaly[] = [];

  headers.filter(h => types[h] === 'number').forEach(h => {
    const nums = rows.map(r => Number(r[h])).filter(v => !isNaN(v));
    if (nums.length < 10) return;

    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const std = Math.sqrt(nums.reduce((a, v) => a + (v - mean) ** 2, 0) / nums.length);
    if (std === 0) return;

    const outlierCount = nums.filter(v => Math.abs(v - mean) > 3 * std).length;
    if (outlierCount > 0) {
      anomalies.push({
        column: h,
        description: `${outlierCount} values fall outside 3 standard deviations (μ=${mean.toFixed(1)}, σ=${std.toFixed(1)})`,
        count: outlierCount
      });
    }
  });

  return anomalies;
}

// ─── Decision Engine ─────────────────────────────────────────────────────────

function generateRecommendations(
  understanding: Omit<DataUnderstanding, 'recommendations' | 'warnings'>
): AetherRecommendation[] {
  const recs: AetherRecommendation[] = [];
  let priority = 1;

  // 1. Quality issues — always highest priority
  if (understanding.duplicateCount > 0 || understanding.completeness < 95 || understanding.corruptRowCount > 0) {
    const issues: string[] = [];
    if (understanding.duplicateCount > 0) issues.push(`${understanding.duplicateCount} duplicate records`);
    if (understanding.completeness < 95) issues.push(`${(100 - understanding.completeness).toFixed(1)}% missing values`);
    if (understanding.corruptRowCount > 0) issues.push(`${understanding.corruptRowCount} corrupted rows`);

    recs.push({
      id: 'quality',
      priority: priority++,
      category: 'quality',
      title: 'Resolve data quality issues',
      description: `${issues.join(' and ')} detected. Clean your data before analysis for reliable results.`,
      reason: `Aether detected quality issues that could affect downstream analysis: ${issues.join(', ')}.`,
      action: 'Navigate to Data Quality stage to review and fix issues.',
      estimatedImpact: understanding.completeness < 80 ? 'high' : 'medium'
    });
  }

  // 2. Analysis based on structure
  const hasTemporal = understanding.temporals.length > 0;
  const hasMeasures = understanding.measures.length > 0;
  const hasDimensions = understanding.dimensions.length > 0;

  if (hasTemporal && hasMeasures) {
    recs.push({
      id: 'timeseries',
      priority: priority++,
      category: 'analysis',
      title: 'Explore trends over time',
      description: `${understanding.measures.length} numeric measure(s) and ${understanding.temporals.length} time field(s) detected. Time-series analysis is appropriate.`,
      reason: `Temporal columns (${understanding.temporals.join(', ')}) combined with measures (${understanding.measures.slice(0, 3).join(', ')}) enable trend analysis.`,
      action: 'Navigate to Analysis stage for time-series exploration.',
      estimatedImpact: 'high'
    });
  }

  if (hasDimensions && hasMeasures) {
    const domainLabel = getDomainLabel(understanding.domain);
    recs.push({
      id: 'breakdown',
      priority: priority++,
      category: 'analysis',
      title: `Explore ${domainLabel.toLowerCase()} performance`,
      description: `${understanding.dimensions.length} categorical dimension(s) can segment your ${understanding.measures.length} measure(s) for comparison.`,
      reason: `Dimensions (${understanding.dimensions.slice(0, 3).join(', ')}) can group measures (${understanding.measures.slice(0, 3).join(', ')}) into meaningful segments.`,
      action: 'Navigate to Analysis stage for segment comparison.',
      estimatedImpact: 'medium'
    });
  }

  // 3. Derivable metrics
  if (understanding.derivableMetrics.length > 0) {
    const metricNames = understanding.derivableMetrics.map(m => m.name).join(', ');
    recs.push({
      id: 'derived',
      priority: priority++,
      category: 'analysis',
      title: `Derive calculated metrics`,
      description: `${understanding.derivableMetrics.length} metric(s) can be computed: ${metricNames}.`,
      reason: understanding.derivableMetrics.map(m => `${m.name}: ${m.formula} — ${m.reason}`).join(' '),
      action: 'Aether can auto-generate these derived columns.',
      estimatedImpact: 'medium'
    });
  }

  // 4. Dashboard recommendation
  if (hasMeasures && (hasDimensions || hasTemporal)) {
    recs.push({
      id: 'dashboard',
      priority: priority++,
      category: 'dashboard',
      title: 'Build a business dashboard',
      description: `A KPI dashboard is appropriate for this dataset. ${understanding.measures.length} metrics across ${understanding.dimensions.length} dimensions.`,
      reason: `Sufficient structure detected: measures for KPI cards, dimensions for breakdowns${hasTemporal ? ', temporal fields for trends' : ''}.`,
      action: 'Navigate to Dashboard stage for visualization.',
      estimatedImpact: 'high'
    });
  }

  // 5. Predictive analysis — only recommend if appropriate
  const potentialTargets = understanding.schema.filter(col => {
    // Good targets: categorical with 2-20 unique values, or numeric measures
    if (col.semanticType === 'identifier' || col.semanticType === 'temporal') return false;
    if (col.type === 'number' && col.semanticType === 'measure') return true;
    if ((col.type === 'string' || col.type === 'boolean') && col.uniqueCount >= 2 && col.uniqueCount <= 20) return true;
    return false;
  });

  if (potentialTargets.length > 0 && understanding.rowCount >= 100) {
    recs.push({
      id: 'prediction',
      priority: priority++,
      category: 'prediction',
      title: 'Explore predictive analysis',
      description: `${potentialTargets.length} potential prediction target(s) identified. ${understanding.rowCount} rows provides sufficient data for modeling.`,
      reason: `Potential targets: ${potentialTargets.slice(0, 3).map(t => t.name).join(', ')}. Minimum 100 rows is met (${understanding.rowCount} available).`,
      action: 'Navigate to Model stage to train ML models.',
      estimatedImpact: understanding.rowCount >= 1000 ? 'high' : 'medium'
    });
  } else {
    // Explicitly recommend against ML when not appropriate
    const reasons: string[] = [];
    if (potentialTargets.length === 0) reasons.push('no suitable prediction target was identified');
    if (understanding.rowCount < 100) reasons.push(`insufficient data (${understanding.rowCount} rows, need ≥100)`);
    
    if (reasons.length > 0) {
      recs.push({
        id: 'no_prediction',
        priority: 99, // Low priority
        category: 'prediction',
        title: 'Predictive analysis not recommended',
        description: `Aether does not recommend ML for this dataset: ${reasons.join(', ')}.`,
        reason: `An intelligent platform should know when NOT to do something. ${reasons.join('. ')}.`,
        action: 'Focus on descriptive analysis and dashboarding instead.',
        estimatedImpact: 'low'
      });
    }
  }

  return recs;
}

// ─── Warning Generation ──────────────────────────────────────────────────────

function generateWarnings(understanding: Omit<DataUnderstanding, 'recommendations' | 'warnings'>): AetherWarning[] {
  const warnings: AetherWarning[] = [];

  // Sensitive fields
  if (understanding.sensitiveFields.length > 0) {
    warnings.push({
      severity: 'warning',
      message: `Sensitive attributes detected: ${understanding.sensitiveFields.join(', ')}. Additional governance considerations recommended.`,
      evidence: `Columns matching PII patterns (email, phone, name, address) were found. Consider data masking or access controls.`
    });
  }

  // Very low completeness
  if (understanding.completeness < 50) {
    warnings.push({
      severity: 'critical',
      message: `Dataset has critically low completeness (${understanding.completeness.toFixed(1)}%). Analysis results may be unreliable.`,
      evidence: `More than half of the data cells are empty or null. Consider data enrichment or source investigation.`
    });
  }

  // High duplicate ratio
  if (understanding.duplicatePercent > 10) {
    warnings.push({
      severity: 'warning',
      message: `${understanding.duplicatePercent.toFixed(1)}% of rows are duplicates. This may indicate data collection issues.`,
      evidence: `${understanding.duplicateCount} exact duplicate rows found out of ${understanding.rowCount} total.`
    });
  }

  // Single-value columns (zero variance)
  understanding.schema.forEach(col => {
    if (col.uniqueCount === 1 && col.nullCount < understanding.rowCount) {
      warnings.push({
        severity: 'info',
        message: `Column "${col.name}" has only one unique value — it carries no information.`,
        column: col.name,
        evidence: `All non-null values in "${col.name}" are identical. Consider dropping this column.`
      });
    }
  });

  // Columns with >50% nulls
  understanding.schema.forEach(col => {
    if (col.nullPercent > 50) {
      warnings.push({
        severity: 'warning',
        message: `Column "${col.name}" is ${col.nullPercent.toFixed(0)}% empty.`,
        column: col.name,
        evidence: `${col.nullCount} of ${understanding.rowCount} values are null/empty. Consider dropping or imputing.`
      });
    }
  });

  return warnings;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function analyzeDataset(headers: string[], rows: DataRow[]): DataUnderstanding {
  if (!rows.length || !headers.length) {
    return createEmptyUnderstanding();
  }

  // 1. Type inference
  const types = inferTypes(headers, rows);

  // 2. Build column understanding
  const schema: ColumnUnderstanding[] = headers.map(h => {
    const profile = profileColumn(h, types[h], rows);
    const values = rows.map(r => r[h]);
    const semanticType = inferSemanticType(h, types[h], values);
    const nullCount = values.filter(v => isEmptyValue(v)).length;
    const uniqueCount = new Set(values.filter(v => !isEmptyValue(v)).map(String)).size;
    const nonNullCount = rows.length - nullCount;

    return {
      name: h,
      type: types[h],
      semanticType,
      nullCount,
      nullPercent: rows.length > 0 ? Math.round((nullCount / rows.length) * 1000) / 10 : 0,
      uniqueCount,
      uniquePercent: nonNullCount > 0 ? Math.round((uniqueCount / nonNullCount) * 1000) / 10 : 0,
      isSensitive: isPII(h, values) || ['email', 'phone', 'name', 'address'].includes(semanticType),
      sampleValues: values.filter(v => !isEmptyValue(v)).slice(0, 5),
      profile
    };
  });

  // 3. Classify columns
  const identifiers = schema.filter(c => c.semanticType === 'identifier').map(c => c.name);
  const dimensions = schema.filter(c => ['dimension', 'categorical', 'geo'].includes(c.semanticType)).map(c => c.name);
  const measures = schema.filter(c => ['measure', 'currency', 'percentage'].includes(c.semanticType)).map(c => c.name);
  const temporals = schema.filter(c => c.semanticType === 'temporal').map(c => c.name);
  const sensitiveFields = schema.filter(c => c.isSensitive).map(c => c.name);

  // 4. Quality metrics
  const totalCells = rows.length * headers.length;
  const nullCells = rows.reduce((a, r) => a + headers.filter(h => isEmptyValue(r[h])).length, 0);
  const completeness = totalCells > 0 ? Math.round(((totalCells - nullCells) / totalCells) * 1000) / 10 : 100;

  const seen = new Set<string>();
  let duplicateCount = 0;
  rows.forEach(r => {
    const key = JSON.stringify(r);
    if (seen.has(key)) duplicateCount++;
    else seen.add(key);
  });

  // Count truly corrupt rows (>80% null)
  const threshold = Math.ceil(headers.length * 0.8);
  const corruptRowCount = rows.filter(r => {
    let nulls = 0;
    for (const h of headers) { if (isEmptyValue(r[h])) nulls++; }
    return nulls >= threshold;
  }).length;

  // 5. Detect domain
  const { domain, confidence: domainConfidence } = detectDomain(headers);

  // 6. Detect derivable metrics
  const derivableMetrics = detectDerivableMetrics(schema, headers, rows);

  // 7. Detect relationships
  const relationships = detectRelationships(headers, rows, types);

  // 8. Detect anomalies
  const anomalies = detectAnomalies(headers, rows, types);

  // 9. Outlier count
  const outlierCount = anomalies.reduce((a, b) => a + b.count, 0);

  // Build partial understanding (without recommendations/warnings)
  const partial = {
    schema,
    rowCount: rows.length,
    columnCount: headers.length,
    identifiers,
    dimensions,
    measures,
    temporals,
    sensitiveFields,
    completeness,
    duplicateCount,
    duplicatePercent: rows.length > 0 ? Math.round((duplicateCount / rows.length) * 1000) / 10 : 0,
    outlierCount,
    corruptRowCount,
    domain,
    domainConfidence,
    derivableMetrics,
    relationships,
    anomalies
  };

  // 10. Generate recommendations and warnings
  const recommendations = generateRecommendations(partial);
  const warnings = generateWarnings(partial);

  return { ...partial, recommendations, warnings };
}

function createEmptyUnderstanding(): DataUnderstanding {
  return {
    schema: [],
    rowCount: 0,
    columnCount: 0,
    identifiers: [],
    dimensions: [],
    measures: [],
    temporals: [],
    sensitiveFields: [],
    completeness: 0,
    duplicateCount: 0,
    duplicatePercent: 0,
    outlierCount: 0,
    corruptRowCount: 0,
    domain: 'generic',
    domainConfidence: 0,
    derivableMetrics: [],
    relationships: [],
    anomalies: [],
    recommendations: [],
    warnings: []
  };
}
