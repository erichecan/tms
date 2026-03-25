import type { Locator } from '@playwright/test';

/** TMS_HUMAN_TYPING=1 时走逐字输入；每键间隔可用 TMS_HUMAN_KEY_DELAY_MS 覆盖 — 2026-03-23T15:12:00 */

export function isHumanTypingEnabled(): boolean {
    return process.env.TMS_HUMAN_TYPING === '1';
}

export function humanKeyDelayMs(): number {
    return Number(process.env.TMS_HUMAN_KEY_DELAY_MS ?? '28');
}

/**
 * 等待可见后点击并清空再写入：类人模式下 pressSequentially，否则 fill。
 * 适用于 text/textarea/password/search 及多数受控 input。
 */
export async function humanFill(
    locator: Locator,
    text: string,
    options?: { delayMs?: number; visibleTimeoutMs?: number }
): Promise<void> {
    const delay = options?.delayMs ?? humanKeyDelayMs();
    const visibleMs = options?.visibleTimeoutMs ?? 30_000;
    await locator.waitFor({ state: 'visible', timeout: visibleMs });
    await locator.click();
    await locator.fill('');
    if (isHumanTypingEnabled()) {
        await locator.pressSequentially(text, { delay });
    } else {
        await locator.fill(text);
    }
}
