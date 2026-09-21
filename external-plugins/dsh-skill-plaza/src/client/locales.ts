/** Skill catalog interface copy; skill names and descriptions remain provider data. */
export const zh = {
  title: '技能广场', subtitle: '浏览并调用已安装的技能', search: '搜索技能名称或描述…',
  loadError: '加载技能目录失败：', loading: '加载中…', featured: '精选场景',
  all: '全部', uncategorized: '未分类', empty: '没有匹配的技能', userOnly: '仅用户可调用',
  noSession: '请先打开一个会话，再选择技能。', busy: '输入正在提交，请稍后重试。',
}
/** Keys owned by the catalog interface. */
export type PlazaKey = keyof typeof zh
/** English counterpart of the catalog dictionary. */
export const en = {
  title: 'Skill Plaza', subtitle: 'Browse and invoke installed skills', search: 'Search skills…',
  loadError: 'Could not load skills: ', loading: 'Loading…', featured: 'Featured skills',
  all: 'All', uncategorized: 'Uncategorized', empty: 'No matching skills', userOnly: 'User invocation only',
  noSession: 'Open a conversation before selecting a skill.', busy: 'The input is being submitted. Please try again.',
} satisfies Record<PlazaKey, string>
