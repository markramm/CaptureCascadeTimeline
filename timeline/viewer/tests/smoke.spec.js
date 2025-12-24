const { test, expect } = require('@playwright/test');

test.describe('Timeline Viewer Smoke Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Go to the starting url before each test.
        await page.goto('/');
        // Check if we need to bypass any landing page, though default is often direct or landing
        const startButton = page.getByRole('button', { name: /Explore Timeline/i });
        if (await startButton.isVisible()) {
            await startButton.click();
        }
    });

    test('has correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Capture Cascade|Kleptocracy/i); // Allow for transition
    });

    test('loads events and displays them', async ({ page }) => {
        // Wait for the event cards to load
        // Assuming 'event-card' class or similar. We can check specifically for the "Events" counter.

        // Check for the events counter. "X Events"
        const statsPanel = page.getByTestId('event-count-display');
        await expect(statsPanel).toBeVisible({ timeout: 10000 });

        // Check that at least one event card is present
        const eventCards = page.locator('.timeline-event-card, .event-card');
        await expect(eventCards.first()).toBeVisible();

        // Verify performance mode is engaged by default (if using IndexedDB)
        // We can check if localStorage has 'useIndexedDB'
        const useIndexedDB = await page.evaluate(() => localStorage.getItem('useIndexedDB'));
        // Since we hardcoded it in config.js to be true/respect flag, we might not see it in localStorage unless set.
        // But we can check if the UI seems responsive or if we see the "Performance Mode" logs if we monitored console.
        // For smoke test, mainly caring about rendering.
    });

    test('filter updates event count', async ({ page }) => {
        // Wait for load
        await expect(page.locator('.timeline-event-card, .event-card').first()).toBeVisible();

        // Get initial count text
        const statsText = await page.getByTestId('event-count-display').textContent();
        const initialCount = parseInt(statsText.match(/(\d+)/)[0]);
        expect(initialCount).toBeGreaterThan(0);

        // Click a tag if available, or just search
        // Using search is safer than relying on specific tags existing
        const searchInput = page.getByPlaceholder(/Search events/i);
        await searchInput.fill('Trump'); // Common keyword in this dataset

        // Wait for count to update
        await expect(page.getByTestId('event-count-display')).not.toHaveText(statsText);

        const newStatsText = await page.getByTestId('event-count-display').textContent();
        const newCount = parseInt(newStatsText.match(/(\d+)/)[0]);

        console.log(`Filtered from ${initialCount} to ${newCount}`);
        expect(newCount).toBeLessThan(initialCount);
    });
});
