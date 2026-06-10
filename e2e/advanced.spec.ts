import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Aether DataOps - Advanced Scenarios', () => {

  test('Scenario 1: Advanced Cleaning Flow (Manual Redaction)', async ({ page }) => {
    await page.goto('/');
    
    // 1. Ingest via Paste
    await page.click('button:has-text("Start Pipeline")');
    await expect(page.locator('text=Integration Hub')).toBeVisible();

    await page.click('text=Local & APIs');
    // Ensure we click the EXACT card for Paste CSV
    await page.locator('.card').filter({ hasText: 'Paste CSV' }).click();
    
    // Wait for modal
    await expect(page.locator('h2', { hasText: 'Paste CSV Data' })).toBeVisible();

    const csvData = `id,name,email,phone\n1,John Doe,john.doe@example.com,555-1234\n2,Jane Smith,jane.smith@example.com,555-5678`;
    
    // Wait for textarea
    await page.fill('textarea[placeholder*="1,Alice"]', csvData);
    await page.click('button:has-text("Parse & Ingest")');

    // 3. Move to Store, then Clean
    await page.locator('.pipe-card:has-text("Store"):not(.disabled)').click();
    await expect(page.locator('h1', { hasText: 'Data Store' }).first()).toBeVisible({ timeout: 10000 });
    
    await page.locator('.pipe-card:has-text("Clean"):not(.disabled)').click();
    await expect(page.locator('text=Data Cleaning').first()).toBeVisible();

    // 4. Use Advanced Tools to redact John Doe
    await page.getByText('Advanced Tools', { exact: true }).click();
    await page.selectOption('select', 'name');
    await page.fill('input[placeholder="Search text..."]', 'John Doe');
    await page.fill('input[placeholder="Replacement..."]', 'REDACTED');
    await page.click('button:has-text("Apply Replace")');

    // 5. Verify the redaction in the Store Stage data preview or verify it applied
    await page.locator('.pipe-card:has-text("Store"):not(.disabled)').click();
    await expect(page.locator('td', { hasText: 'REDACTED' }).first()).toBeVisible();
    await expect(page.locator('td', { hasText: 'John Doe' })).toHaveCount(0);
  });

  test('Scenario 2: Schema Drift & Data Contract Enforcement', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Start Pipeline")');

    // 1. Toggle Data Contract Enforcement
    await page.check('input#contractToggle');

    // 2. Set expected columns to 3
    await page.fill('input[type="number"]', '3');

    // 3. Upload a CSV with 4 columns
    const testCsvPath = path.join(__dirname, 'test_schema_drift.csv');
    fs.writeFileSync(testCsvPath, 'col1,col2,col3,col4\n1,2,3,4');
    
    await page.click('text=Local & APIs');
    // Set input files
    await page.setInputFiles('input[type="file"]', testCsvPath);

    // 4. Assert Error toast/message appears
    await expect(page.locator('text=SCHEMA DRIFT DETECTED')).toBeVisible();

    // Clean up
    fs.unlinkSync(testCsvPath);
  });

  test('Scenario 3: Full 5-Stage Data Pipeline Execution', async ({ page }) => {
    await page.goto('/');
    
    // Stage 1: Ingest
    await page.click('button:has-text("Start Pipeline")');
    await page.click('text=Sample datasets');
    await page.locator('h3', { hasText: 'finance' }).click();

    // Stage 2: Store
    await page.locator('.pipe-card:has-text("Store"):not(.disabled)').click();
    await expect(page.locator('h1', { hasText: 'Data Store' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=quarter').first()).toBeVisible();
    
    // Proceed to Clean
    await page.locator('.pipe-card:has-text("Clean"):not(.disabled)').click();

    // Stage 3: Clean
    await expect(page.locator('h1', { hasText: 'Data Cleaning' }).first()).toBeVisible();
    await page.locator('.op-card', { hasText: 'Fill Null Values' }).click();
    
    // Proceed to Path Selection
    await page.click('button:has-text("Analyze Data →")');
    await expect(page.locator('h1', { hasText: 'Choose Your' })).toBeVisible();

    // Select BI Engineer Path to go to Dashboard
    await page.locator('.card', { hasText: 'BI Engineer' }).click();

    // Stage 4: Dashboard
    await expect(page.locator('text=Dashboard & Reporting').first()).toBeVisible();
    
    // Proceed to BI Report
    await page.click('button:has-text("BI Report")');

    // Stage 5: BI Report
    await expect(page.locator('text=Aether BI Report').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Print Report")')).toBeVisible();
  });
});
