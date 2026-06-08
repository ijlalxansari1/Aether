import { inferTypes, findReplace, dropColumn } from '@/lib/dataUtils';

describe('dataUtils core logic', () => {
  const sampleHeaders = ['name', 'age', 'salary'];
  const sampleRows = [
    { name: 'Alice', age: 30, salary: 75000 },
    { name: 'Bob', age: 25, salary: null },
    { name: 'Charlie', age: 'unknown', salary: 50000 },
  ];

  describe('inferTypes', () => {
    it('should correctly infer string and number types', () => {
      const types = inferTypes(sampleHeaders, sampleRows);
      expect(types.name).toBe('string');
      // Age has an 'unknown' string, so it should fallback to string
      expect(types.age).toBe('string'); 
      // Salary has nulls but mostly numbers
      expect(types.salary).toBe('number');
    });
  });

  describe('findReplace', () => {
    it('should correctly replace values in a specific column', () => {
      const result = findReplace('name', 'Alice', 'Alicia', sampleRows);
      expect(result[0].name).toBe('Alicia');
      expect(result[1].name).toBe('Bob'); // unmodified
    });
  });

  describe('dropColumn', () => {
    it('should remove a column from headers and rows', () => {
      const result = dropColumn('salary', sampleHeaders, sampleRows);
      expect(result.headers).not.toContain('salary');
      expect(result.rows[0]).not.toHaveProperty('salary');
      expect(result.rows[0]).toHaveProperty('name');
    });
  });
});
