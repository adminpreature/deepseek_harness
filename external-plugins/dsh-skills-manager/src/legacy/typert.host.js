/* Pinned published RPC definitions adapted to the target codec factory API. */
import { z } from 'zod'

const _deepseek_ai_dsh_skills_manage_skillsManage_importFiles_parameter_0$schema = z.array(z.object({
  'name': z.string(),
  'content': z.string(),
}))
const _deepseek_ai_dsh_skills_manage_skillsManage_importFiles_result$schema = z.object({
  'ok': z.boolean(),
  'message': z.string(),
  'imported': z.array(z.string()),
})
const _deepseek_ai_dsh_skills_manage_skillsManage_importPath_parameter_0$schema = z.string()
const _deepseek_ai_dsh_skills_manage_skillsManage_importPath_result$schema = z.object({
  'ok': z.boolean(),
  'message': z.string(),
  'imported': z.array(z.string()),
})
const _deepseek_ai_dsh_skills_manage_skillsManage_refresh_result$schema = z.object({
  'ok': z.boolean(),
  'message': z.string(),
})

export const TYPERT = {
  package: '@baikai233/dsh-skills-manager',
  face: 'host',
  schemas: [
  ],
  invocations: [
    {
      id: '@baikai233/dsh-skills-manager#skillsManage/importFiles',
      service: 'skillsManage',
      namespace: 'skillsManage',
      method: 'importFiles',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'files',
          wire: 'files',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: '@baikai233/dsh-skills-manager#skillsManage/importFiles:files',
            create: () => _deepseek_ai_dsh_skills_manage_skillsManage_importFiles_parameter_0$schema,
          },
        },
      ],
      result: {
        mode: 'strict',
        typeSymbol: '@baikai233/dsh-skills-manager/types#ImportOutcome',
        create: () => _deepseek_ai_dsh_skills_manage_skillsManage_importFiles_result$schema,
      },
      sourceLocation: {"file":"packages/skill/skills-manage/src/index.ts","line":151,"column":9},
    },
    {
      id: '@baikai233/dsh-skills-manager#skillsManage/importPath',
      service: 'skillsManage',
      namespace: 'skillsManage',
      method: 'importPath',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'path',
          wire: 'path',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: '@baikai233/dsh-skills-manager#skillsManage/importPath:path',
            create: () => _deepseek_ai_dsh_skills_manage_skillsManage_importPath_parameter_0$schema,
          },
        },
      ],
      result: {
        mode: 'strict',
        typeSymbol: '@baikai233/dsh-skills-manager/types#ImportOutcome',
        create: () => _deepseek_ai_dsh_skills_manage_skillsManage_importPath_result$schema,
      },
      sourceLocation: {"file":"packages/skill/skills-manage/src/index.ts","line":143,"column":9},
    },
    {
      id: '@baikai233/dsh-skills-manager#skillsManage/refresh',
      service: 'skillsManage',
      namespace: 'skillsManage',
      method: 'refresh',
      invocation: { kind: 'direct' },
      parameters: [
      ],
      result: {
        mode: 'strict',
        typeSymbol: '@baikai233/dsh-skills-manager/types#SkillsRefreshResult',
        create: () => _deepseek_ai_dsh_skills_manage_skillsManage_refresh_result$schema,
      },
      sourceLocation: {"file":"packages/skill/skills-manage/src/index.ts","line":159,"column":9},
    },
  ],
  model: {
    "services": [],
    "events": [],
    "objects": []
  },
}
