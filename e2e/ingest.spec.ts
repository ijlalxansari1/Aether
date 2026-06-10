import { test, expect } from '@playwright/test';

test.describe('Aether Data Pipeline E2E', () => {
  test('should ingest sample dataset and proceed to store stage', async ({ page }) => {
    // 1. Go to the app
    await page.goto('/');
    
    // Wait for the headline to be visible
    await expect(page.locator('text=Turn raw data into')).toBeVisible();

    // 2. Click Start Pipeline
    await page.click('button:has-text("Start Pipeline")');

    // Wait for Ingest stage to be visible
    await expect(page.locator('text=Integration Hub')).toBeVisible();

    // 3. Switch to "Sample datasets" tab
    await page.click('text=Sample datasets');

    // 4. Click the "sales" sample dataset
    await page.click('h3:has-text("sales")');

    // 5. It should process and move to Store stage
    // The StoreStage has "Data Warehouse" text and shows the schema
    await expect(page.locator('text=Data Warehouse').first()).toBeVisible({ timeout: 10000 });
    
    // Ensure we see a schema field (e.g., month, region, product)
    await expect(page.locator('text=month').first()).toBeVisible();
    await expect(page.locator('text=region').first()).toBeVisible();
  });
});
