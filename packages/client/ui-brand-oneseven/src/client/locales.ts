/** Brand copy shared by the two supported interface languages. */

/** Simplified Chinese brand dictionary. */
export const zh = { name: 'OneSeven', label: 'OneSeven / 壹柒' }

/** Keys accepted by the brand slot translator. */
export type BrandKey = keyof typeof zh

/** English brand dictionary. */
export const en = { name: 'OneSeven', label: 'OneSeven / 壹柒' } satisfies Record<BrandKey, string>
