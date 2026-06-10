import { 
  inferType, inferTypes, isPII, profileColumn, detectIssues, 
  applyCleanOp, calcDQScore, fmtNum, calcBoxPlot, dropColumn, 
  findReplace, freqMap, completenessPercent, calcPearsonCorrelation, 
  simulateABTest 
} from '@/lib/dataUtils';

describe('dataUtils core logic', () => {
  const sampleHeaders = ['name', 'age', 'salary', 'email'];
  const sampleRows = [
    { name: 'Alice', age: 30, salary: 75000, email: 'alice@test.com' },
    { name: 'Bob', age: 25, salary: null, email: 'bob@test.com' },
    { name: 'Charlie', age: 'unknown', salary: 50000, email: '' },
    { name: 'Alice', age: 30, salary: 75000, email: 'alice@test.com' } // Duplicate
  ];

  describe('Type Inference & PII', () => {
    it('inferType should return correct type', () => {
      expect(inferType(['Alice', 'Bob', 'Charlie'])).toBe('string');
      expect(inferType([1, 2, 3, null])).toBe('number');
      expect(inferType([true, false, 'true'])).toBe('boolean');
      expect(inferType(['2024-01-01', '2024-02-01'])).toBe('date');
    });

    it('inferTypes should map multiple columns', () => {
      const types = inferTypes(sampleHeaders, sampleRows);
      expect(types.name).toBe('string');
      expect(types.age).toBe('string'); 
      expect(types.salary).toBe('number');
    });

    it('isPII should detect sensitive columns', () => {
      expect(isPII('email', sampleRows.map(r => r.email))).toBe(true);
      expect(isPII('age', sampleRows.map(r => r.age))).toBe(false);
    });
  });

  describe('Profiling and Issues', () => {
    it('profileColumn should calculate numerical stats', () => {
      const profile = profileColumn('salary', 'number', sampleRows);
      expect(profile.count).toBe(3); // 3 non-nulls
      expect(profile.nulls).toBe(1); // 1 null
      expect(profile.max).toBe(75000);
      expect(profile.min).toBe(50000);
    });

    it('detectIssues should find duplicates and nulls', () => {
      const types = inferTypes(sampleHeaders, sampleRows);
      const issues = detectIssues(sampleHeaders, sampleRows, types);
      
      const dupIssue = issues.find(i => i.type === 'duplicate');
      expect(dupIssue).toBeDefined();
      expect(dupIssue?.count).toBe(1);

      const nullIssue = issues.find(i => i.type === 'null' && i.column === 'salary');
      expect(nullIssue).toBeDefined();
    });
  });

  describe('Cleaning Operations', () => {
    it('applyCleanOp: remove_dups', () => {
      const types = inferTypes(sampleHeaders, sampleRows);
      const cleaned = applyCleanOp('remove_dups', sampleRows, sampleHeaders, types);
      expect(cleaned.length).toBe(3); // 1 duplicate removed
    });

    it('applyCleanOp: fill_nulls', () => {
      const types = inferTypes(sampleHeaders, sampleRows);
      const cleaned = applyCleanOp('fill_nulls', sampleRows, sampleHeaders, types);
      // Salary should be filled with median of (50k, 75k, 75k) -> 75000
      expect(cleaned[1].salary).toBe(75000);
    });
  });

  describe('Data Transformers & Utilities', () => {
    it('calcDQScore calculates data quality', () => {
      const score = calcDQScore(sampleRows, sampleHeaders, 0);
      expect(score).toBeLessThan(100);
    });

    it('fmtNum formats numbers correctly', () => {
      expect(fmtNum(1500)).toBe('1.5K');
      expect(fmtNum(2000000)).toBe('2.0M');
      expect(fmtNum(42.123)).toBe('42.1');
    });

    it('findReplace should correctly replace string values', () => {
      const result = findReplace('name', 'Alice', 'Alicia', sampleRows);
      expect(result[0].name).toBe('Alicia');
      expect(result[1].name).toBe('Bob'); 
    });

    it('dropColumn should remove a column', () => {
      const result = dropColumn('salary', sampleHeaders, sampleRows);
      expect(result.headers).not.toContain('salary');
      expect(result.rows[0]).not.toHaveProperty('salary');
    });

    it('completenessPercent should be accurate', () => {
      const p = completenessPercent(sampleHeaders, sampleRows);
      // 2 nulls (Bob's salary, Charlie's email) out of 16 cells = 14/16 = 87.5%
      expect(p).toBe(87.5);
    });
  });

  describe('Statistics', () => {
    it('calcPearsonCorrelation should compute accurately', () => {
      const rows = [
        { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }
      ];
      const p = calcPearsonCorrelation('x', 'y', rows);
      expect(p).toBeCloseTo(1.0);
    });

    it('calcBoxPlot calculates quartiles', () => {
      const rows = [
        { v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 5 }
      ];
      const box = calcBoxPlot('v', rows);
      expect(box.median).toBe(3);
    });

    it('simulateABTest calculates p-values', () => {
      const rows = [
        { group: 'A', metric: 10 }, { group: 'A', metric: 12 }, { group: 'A', metric: 11 },
        { group: 'B', metric: 20 }, { group: 'B', metric: 22 }, { group: 'B', metric: 21 }
      ];
      const result = simulateABTest('metric', 'group', 'A', 'B', rows);
      expect(result.significant).toBe(true);
      expect(result.diff).toBeGreaterThan(0);
    });
  });
});
