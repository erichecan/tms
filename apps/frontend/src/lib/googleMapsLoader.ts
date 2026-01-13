// ============================================================================
// Google Maps 统一加载器
// 创建时间: 2026-01-09
// 说明: 提供幂等的 Google Maps API 脚本加载，支持 CSP/nonce 和错误处理
// ============================================================================

/// <reference types="google.maps" />

/**
 * 加载 Google Maps JavaScript API
 * 提供幂等加载，避免重复注入脚本
 * 
 * @param apiKey - Google Maps API Key
 * @param libraries - 需要加载的库，默认为 ['places', 'geometry']
 * @returns Promise<typeof google> - 返回 google 对象
 */
export const loadGoogleMaps = (() => {
    let promise: Promise<typeof google> | null = null;

    return (apiKey: string): Promise<typeof google> => {
        if (typeof window === 'undefined') {
            return Promise.reject(new Error('Browser environment required'));
        }

        if (promise) return promise;

        promise = new Promise((resolve, reject) => {
            // Google Maps JS API Bootstrap Loader
            // @ts-ignore
            (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.googleapis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? (console.warn(p + " only loads once. Ignoring:", g), d[l]) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
                key: apiKey,
                v: "weekly",
            });

            // Wait for basic maps to be available to resolve the main promise
            // @ts-ignore
            window.google.maps.importLibrary("maps").then(() => {
                resolve((window as any).google);
            }).catch(reject);
        });

        return promise;
    };
})();

/**
 * Helper to import a library dynamically
 */
export async function importLibrary(name: any): Promise<any> {
    const google = (window as any).google;
    if (!google?.maps?.importLibrary) {
        throw new Error('Google Maps not initialized');
    }
    return google.maps.importLibrary(name);
}

/**
 * 检查 Google Maps API 是否已加载
 */
export const isGoogleMapsLoaded = (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).google?.maps;
};
