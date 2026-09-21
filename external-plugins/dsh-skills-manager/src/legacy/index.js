import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { parse } from "yaml";
import { cp, mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
//#region lib/types/library.js
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/**
* Parse the small, DSH-relevant frontmatter subset of a Claude-style skill.
* @returns undefined when the file is absent, malformed, or lacks a name.
*/
function parseSkillFile(path) {
	let raw;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return;
	}
	return parseSkillText(raw);
}
/** Parse skill text without touching the filesystem. */
function parseSkillText(raw) {
	const firstLineEnd = raw.indexOf("\n");
	if (firstLineEnd < 0 || raw.slice(0, firstLineEnd).replace(/\r$/, "") !== "---") return void 0;
	const start = firstLineEnd + 1;
	let lineStart = start;
	let closing;
	while (lineStart <= raw.length) {
		const nextNewline = raw.indexOf("\n", lineStart);
		const lineEnd = nextNewline < 0 ? raw.length : nextNewline;
		if (raw.slice(lineStart, lineEnd).replace(/\r$/, "") === "---") {
			closing = lineStart;
			break;
		}
		if (nextNewline < 0) return void 0;
		lineStart = nextNewline + 1;
	}
	if (closing === void 0) return void 0;
	const bodyStart = raw.indexOf("\n", closing);
	const body = bodyStart < 0 ? "" : raw.slice(bodyStart + 1);
	let data;
	try {
		data = parse(raw.slice(start, closing));
	} catch {
		return;
	}
	if (typeof data !== "object" || data === null || Array.isArray(data)) return void 0;
	const record = data;
	const name = record["name"];
	const description = record["description"];
	if (typeof name !== "string" || name.length === 0 || !SKILL_NAME.test(name)) return void 0;
	if (typeof description !== "string" || description.length === 0) return void 0;
	return {
		name,
		description,
		content: body.trim()
	};
}
/**
* Discover one-level skill bundles (`<name>/SKILL.md`) and flat `.md` skills.
* Nested skill trees are intentionally ignored, matching dsh-skill-filesystem.
*/
function discoverLibrary(dirs) {
	const byName = /* @__PURE__ */ new Map();
	for (const dir of dirs) {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			let kind = entry.isDirectory() ? "directory" : entry.isFile() ? "file" : void 0;
			if (entry.isSymbolicLink()) try {
				kind = statSync(join(dir, entry.name)).isDirectory() ? "directory" : "file";
			} catch {
				continue;
			}
			let path;
			let directory;
			if (kind === "directory") {
				path = join(dir, entry.name, "SKILL.md");
				directory = join(dir, entry.name);
			} else if (kind === "file" && entry.name.endsWith(".md") && entry.name !== "SKILL.md") {
				path = join(dir, entry.name);
				directory = dir;
			} else continue;
			const parsed = parseSkillFile(path);
			if (parsed === void 0) continue;
			if (byName.get(parsed.name) !== void 0) continue;
			byName.set(parsed.name, {
				name: parsed.name,
				description: parsed.description,
				path,
				directory
			});
		}
	}
	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
//#endregion
//#region lib/types/import.js
const MAX_FILE_BYTES = 512 * 1024;
function kebabName(value) {
	const candidate = value.trim().toLowerCase().replace(/[\s_]+/g, "-");
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) ? candidate : void 0;
}
async function existsAsDirectory(targetDir) {
	try {
		return (await stat(targetDir)).isDirectory();
	} catch {
		return false;
	}
}
async function importFileText(managedDir, rawName, content) {
	if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) return { error: `${rawName}: 文件超过 512 KiB 限制` };
	const parsed = parseSkillText(content);
	const fromBasename = rawName !== "SKILL.md" && rawName.endsWith(".md") ? kebabName(basename(rawName, ".md")) : void 0;
	const name = parsed?.name ?? fromBasename;
	if (name === void 0) return { error: `${rawName}: 无法解析 SKILL.md 的 name` };
	const targetDir = join(managedDir, name);
	if (await existsAsDirectory(targetDir)) return { error: `${name}: skill 已存在，跳过` };
	await mkdir(targetDir, { recursive: true });
	await writeFile(join(targetDir, "SKILL.md"), content, "utf8");
	return { name };
}
async function importDirectory(managedDir, dir, visited = /* @__PURE__ */ new Set()) {
	const imported = [];
	const skipped = [];
	let real;
	try {
		real = await realpath(dir);
	} catch {
		real = dir;
	}
	if (visited.has(real)) return {
		imported,
		skipped: [`${basename(dir)}: 符号链接循环，已跳过`]
	};
	visited.add(real);
	const direct = join(dir, "SKILL.md");
	try {
		if ((await stat(direct)).isFile()) {
			const parsed = parseSkillFile(direct);
			if (parsed === void 0) return {
				imported,
				skipped: [basename(dir)]
			};
			if (await existsAsDirectory(join(managedDir, parsed.name))) return {
				imported,
				skipped: [parsed.name]
			};
			await cp(dir, join(managedDir, parsed.name), { recursive: true });
			imported.push(parsed.name);
			return {
				imported,
				skipped
			};
		}
	} catch {}
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const child = join(dir, entry.name);
		try {
			let isDir = entry.isDirectory();
			let isFile = entry.isFile();
			if (entry.isSymbolicLink()) {
				const childStats = await stat(child);
				isDir = childStats.isDirectory();
				isFile = childStats.isFile();
			}
			if (isDir) {
				const result = await importDirectory(managedDir, child, visited);
				imported.push(...result.imported);
				skipped.push(...result.skipped);
			} else if (isFile) {
				if (entry.name === "SKILL.md") {
					const content = await readFile(child, "utf8");
					const parsed = parseSkillText(content);
					if (parsed === void 0) {
						skipped.push(entry.name);
						continue;
					}
					if (await existsAsDirectory(join(managedDir, parsed.name))) {
						skipped.push(parsed.name);
						continue;
					}
					await mkdir(join(managedDir, parsed.name), { recursive: true });
					await writeFile(join(managedDir, parsed.name, "SKILL.md"), content, "utf8");
					imported.push(parsed.name);
				} else if (entry.name.endsWith(".md")) {
					const result = await importFileText(managedDir, entry.name, await readFile(child, "utf8"));
					if (result.error !== void 0) skipped.push(result.error);
					else if (result.name !== void 0) imported.push(result.name);
				}
			}
		} catch (error) {
			skipped.push(`${entry.name}: ${String(error)}`);
		}
	}
	return {
		imported,
		skipped
	};
}
async function importFromPath(managedDir, inputPath) {
	const dir = resolve(inputPath);
	let stats;
	try {
		stats = await stat(dir);
	} catch (error) {
		return {
			ok: false,
			message: `路径不可用: ${String(error)}`,
			imported: []
		};
	}
	try {
		if (stats.isDirectory()) {
			const result = await importDirectory(managedDir, dir);
			if (result.imported.length === 0 && result.skipped.length === 0) return {
				ok: false,
				message: "目录中没有找到可导入的 skill",
				imported: []
			};
			return {
				ok: result.imported.length > 0,
				message: `导入 ${result.imported.length} 个${result.skipped.length > 0 ? `，跳过: ${result.skipped.join(", ")}` : ""}`,
				imported: result.imported
			};
		}
		if (stats.isFile()) {
			const content = await readFile(dir, "utf8");
			const parsed = parseSkillText(content);
			if (parsed === void 0) return {
				ok: false,
				message: "文件无法解析为 skill",
				imported: []
			};
			if (await existsAsDirectory(join(managedDir, parsed.name))) return {
				ok: false,
				message: `${parsed.name} 已存在`,
				imported: []
			};
			await mkdir(join(managedDir, parsed.name), { recursive: true });
			await writeFile(join(managedDir, parsed.name, "SKILL.md"), content, "utf8");
			return {
				ok: true,
				message: `导入 1 个: ${parsed.name}`,
				imported: [parsed.name]
			};
		}
		return {
			ok: false,
			message: "路径既不是文件也不是目录",
			imported: []
		};
	} catch (error) {
		return {
			ok: false,
			message: `导入失败: ${String(error)}`,
			imported: []
		};
	}
}
async function importFromFiles(managedDir, files) {
	const imported = [];
	const skipped = [];
	for (const file of files) {
		const result = await importFileText(managedDir, file.name, file.content);
		if (result.error !== void 0) skipped.push(result.error);
		else if (result.name !== void 0) imported.push(result.name);
	}
	if (imported.length === 0 && skipped.length === 0) return {
		ok: false,
		message: "没有收到文件",
		imported: []
	};
	return {
		ok: imported.length > 0,
		message: `导入 ${imported.length} 个${skipped.length > 0 ? `，跳过: ${skipped.join(", ")}` : ""}`,
		imported
	};
}
//#endregion
//#region lib/types/presets.js
/**
* Preset groups. These are schema defaults, so they appear on first run and
* can be freely replaced by the user layer afterwards.
*/
const PRESET_GROUPS = [
	{
		id: "office",
		name: "办公",
		description: "文档、表格、演示与周报",
		skills: [
			"pdf",
			"xlsx",
			"pptx",
			"docx",
			"weekly-report-generator",
			"internal-comms",
			"doc-coauthoring"
		]
	},
	{
		id: "vibecoding",
		name: "Vibe Coding",
		description: "前端原型、全栈实现与代码评审",
		skills: [
			"frontend-design",
			"web-artifacts-builder",
			"webapp-testing",
			"code-review",
			"implement",
			"tdd",
			"to-spec",
			"domain-modeling",
			"diagnosing-bugs",
			"research",
			"wayfinder",
			"codebase-design",
			"improve-codebase-architecture",
			"prototype",
			"resolving-merge-conflicts"
		]
	},
	{
		id: "academic-writing",
		name: "科研写作",
		description: "论文、图表、引用与写作协作",
		skills: [
			"doc-coauthoring",
			"writing-for-agents",
			"research",
			"pdf",
			"xlsx",
			"pptx",
			"internal-comms",
			"weekly-report-generator",
			"grill-with-docs",
			"to-questionnaire",
			"teach"
		]
	},
	{
		id: "all",
		name: "全部启用",
		description: "自动包含 Skill 库中的全部 Skill",
		skills: []
	}
];
//#endregion
//#region lib/types/provider.js
/**
* Dynamic skill provider. It contributes only the currently active group and
* invalidates its catalog whenever the settings section commits a new value,
* so group switches are visible without restarting the host.
*/
var ManagedSkillProvider = class {
	scope;
	library;
	rank;
	/** Registry provider identity; unique per mounted skills-manage plugin. */
	name;
	constructor(scope, control, library, providerName, rank) {
		this.scope = scope;
		this.library = library;
		this.rank = rank;
		this.name = providerName;
		const off = scope.watch(() => {
			control.invalidate();
		});
		control.signal.addEventListener("abort", () => {
			off();
		}, { once: true });
	}
	resolveActiveSkills() {
		const settings = this.scope.get();
		if (settings.activeGroup === "") return [];
		const group = settings.groups.find((candidate) => candidate.id === settings.activeGroup);
		if (group === void 0) return [];
		if (group.id === "all") return [...this.library.skills];
		const selected = new Set(group.skills);
		return this.library.skills.filter((skill) => selected.has(skill.name));
	}
	async list(_options) {
		return this.resolveActiveSkills().map((skill) => ({
			name: skill.name,
			description: skill.description,
			invocation: {
				modelInvocable: true,
				userInvocable: true
			},
			provider: this.name,
			source: "skills-manage",
			rank: this.rank,
			locator: {
				path: skill.path,
				directory: skill.directory
			},
			resourceBase: {
				kind: "directory",
				path: skill.directory
			},
			path: skill.path
		}));
	}
	async get(candidate, _options) {
		const path = candidate.locator?.path ?? candidate.path;
		if (path === void 0) return void 0;
		const parsed = parseSkillFile(path);
		if (parsed === void 0) return void 0;
		return {
			name: parsed.name,
			description: parsed.description,
			invocation: candidate.invocation,
			provider: this.name,
			source: candidate.source,
			...candidate.resourceBase === void 0 ? {} : { resourceBase: candidate.resourceBase },
			path,
			content: parsed.content
		};
	}
};
//#endregion
//#region lib/types/index.js
/**
* Skills Manage — one host plugin that turns a library of Claude-style
* `SKILL.md` bundles into switchable, user-owned groups.
*
* - registers the `skills-manage` settings namespace
* - discovers the configured library dirs plus a managed import directory
* - registers a dynamic SkillProvider whose catalog follows the active group
* - exposes import and refresh commands through a Typert Remote namespace
*   (`skillsManage.importPath` / `skillsManage.importFiles` /
*   `skillsManage.refresh`) so no command-shaped settings fields are needed
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
const name = "skills-manage";
/** Settings namespace owned by this plugin. */
const SKILLS_MANAGE_NAMESPACE = "skills-manage";
const SkillGroupSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().default(""),
	skills: z.array(z.string()).default([])
});
const LibraryEntrySchema = z.object({
	name: z.string().min(1),
	description: z.string().default("")
});
const SettingsSchema = z.object({
	activeGroup: z.string().default("office"),
	groups: z.array(SkillGroupSchema).default(PRESET_GROUPS),
	presets: z.array(SkillGroupSchema).default(PRESET_GROUPS),
	library: z.array(LibraryEntrySchema).default([])
});
function projectLibrary(store) {
	return store.skills.map((skill) => ({
		name: skill.name,
		description: skill.description
	}));
}
function sameProjection(a, b) {
	if (a.length !== b.length) return false;
	return a.every((entry, index) => entry.name === b[index]?.name && entry.description === b[index]?.description);
}
/**
* Host service: settings namespace, dynamic skill provider, and import/refresh
* Remote commands.
*/
let SkillsManageService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _importPath_decorators;
	let _importFiles_decorators;
	let _refresh_decorators;
	return class SkillsManageService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_importPath_decorators = [Remote("importPath")];
			_importFiles_decorators = [Remote("importFiles")];
			_refresh_decorators = [Remote("refresh")];
			__esDecorate(this, null, _importPath_decorators, {
				kind: "method",
				name: "importPath",
				static: false,
				private: false,
				access: {
					has: (obj) => "importPath" in obj,
					get: (obj) => obj.importPath
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _importFiles_decorators, {
				kind: "method",
				name: "importFiles",
				static: false,
				private: false,
				access: {
					has: (obj) => "importFiles" in obj,
					get: (obj) => obj.importFiles
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _refresh_decorators, {
				kind: "method",
				name: "refresh",
				static: false,
				private: false,
				access: {
					has: (obj) => "refresh" in obj,
					get: (obj) => obj.refresh
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		static inject = ["settings", "skills"];
		static Config = z.object({
			libraryDirs: z.array(z.string()).default([]),
			managedLibraryDir: z.string(),
			providerName: z.string().default("skills-manage"),
			rank: z.number().default(250)
		});
		managedDir = __runInitializers(this, _instanceExtraInitializers);
		allDirs;
		store;
		scope;
		constructor(ctx, config = {}) {
			super(ctx, "skillsManage");
			this.managedDir = resolve(config.managedLibraryDir ?? join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "skills-manage", "library"));
			this.allDirs = [...config.libraryDirs ?? [], this.managedDir];
			this.store = { skills: discoverLibrary(this.allDirs) };
			this.scope = ctx.settings.register(SKILLS_MANAGE_NAMESPACE, SettingsSchema, { applies: "live" });
			ctx.settings.mutate(SKILLS_MANAGE_NAMESPACE, [
				{
					op: "unset",
					path: ["importRequest"]
				},
				{
					op: "unset",
					path: ["importResult"]
				},
				{
					op: "unset",
					path: ["refreshRequestId"]
				},
				{
					op: "unset",
					path: ["refreshResult"]
				}
			]);
			if (!sameProjection(this.scope.get().library, projectLibrary(this.store))) this.scope.update({ library: projectLibrary(this.store) });
			ctx.skills.registerProvider((control) => new ManagedSkillProvider(this.scope, control, this.store, config.providerName ?? "skills-manage", config.rank ?? 250));
		}
		/** Import skills from a host filesystem path. */
		async importPath(path) {
			const outcome = await importFromPath(this.managedDir, path);
			if (outcome.ok) await this.rescanLibrary();
			return outcome;
		}
		/** Import browser-uploaded markdown files. */
		async importFiles(files) {
			const outcome = await importFromFiles(this.managedDir, files);
			if (outcome.ok) await this.rescanLibrary();
			return outcome;
		}
		/** Rescan library roots and publish the fresh projection. */
		async refresh() {
			const before = this.store.skills.length;
			this.store.skills = discoverLibrary(this.allDirs);
			await this.scope.update({ library: projectLibrary(this.store) });
			return {
				ok: true,
				message: `Skill 库已刷新：${before} → ${this.store.skills.length} 个 Skill`
			};
		}
		async rescanLibrary() {
			this.store.skills = discoverLibrary(this.allDirs);
			await this.scope.update({ library: projectLibrary(this.store) });
		}
	};
})();
//#endregion
export { ManagedSkillProvider, PRESET_GROUPS, SKILLS_MANAGE_NAMESPACE, SkillsManageService, SkillsManageService as default, name };
