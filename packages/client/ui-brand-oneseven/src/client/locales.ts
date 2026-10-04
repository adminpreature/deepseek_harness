/** Brand copy shared by the two supported interface languages. */

/** Simplified Chinese brand dictionary. */
export const zh = { name: 'Agents lite', label: 'Agents lite' }

/** Keys accepted by the brand slot translator. */
export type BrandKey = keyof typeof zh

/** English brand dictionary. */
export const en = { name: 'Agents lite', label: 'Agents lite' } satisfies Record<BrandKey, string>
