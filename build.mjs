// 构建脚本：把 zcode 的 10 个设计类 skills 打包成 DeepSeek Harness 插件
// 源：C:\Users\denglizi\.agents\skills  →  D:\dsh-plugins\dsh-zcode-design-skills
import { readFile, readdir, rm, mkdir, cp, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SRC = "C:\\Users\\denglizi\\.agents\\skills";
const OUT = "D:\\dsh-plugins\\dsh-zcode-design-skills";
const SKILL_DIRS = [
  "gsap-core", "gsap-frameworks", "gsap-performance", "gsap-plugins",
  "gsap-react", "gsap-scrolltrigger", "gsap-timeline", "gsap-utils",
  "react-bits", "taste-skill",
];

/** 极简 frontmatter 解析：支持 `key: 单行值` 与 `key: >` / `>-` 折叠标量 */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val === ">" || val === ">-") {
      // 折叠标量：收集缩进更深的行，按空格拼接
      const parts = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const l = lines[j];
        if (/^\S/.test(l) || !l.trim()) break;
        parts.push(l.trim());
      }
      val = parts.join(" ");
      i = j - 1;
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }
    meta[key] = val;
  }
  return { meta, body: text.slice(m[0].length) };
}

const PKG_NAME = "dsh-zcode-design-skills";
const PLUGIN_ID = "zcode-design-skills";

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, "assets"), { recursive: true });
await mkdir(join(OUT, "lib"), { recursive: true });
await mkdir(join(OUT, "locale"), { recursive: true });

const entries = [];
for (const dir of SKILL_DIRS) {
  const srcDir = join(SRC, dir);
  const raw = await readFile(join(srcDir, "SKILL.md"), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const name = meta.name || dir;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`非法技能名: ${name}`);
  // 拷贝整个技能目录，SKILL.md 只保留正文（frontmatter 信息进 lib/index.js）
  const destDir = join(OUT, "assets", name);
  await cp(srcDir, destDir, { recursive: true });
  await writeFile(join(destDir, "SKILL.md"), body);
  entries.push({ name, dir: name, description: meta.description || "" });
  console.log(`✓ ${name} (${meta.description ? "description ok" : "无 description"})`);
}

// lib/index.js —— 与官方 @deepseek-ai/dsh-skill-badge 同构的技能提供者
const js = `// 由 build-zcode-design-skills.mjs 生成 —— 装载 zcode 设计类 skills
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PROVIDER_NAME = "zcode-design-skills";
// 与官方 BUNDLED_SKILL_RANK 一致（打包技能提供者的标准优先级）
const RANK = 600;
const ASSETS_BASE = { kind: "directory", path: fileURLToPath(new URL("../assets/", import.meta.url)) };

const SKILLS = ${JSON.stringify(entries, null, "\t")};

const provider = {
	name: PROVIDER_NAME,
	list: () => Promise.resolve(SKILLS.map((s) => ({
		name: s.name,
		description: s.description,
		invocation: { modelInvocable: true, userInvocable: true },
		provider: PROVIDER_NAME,
		source: "bundled",
		resourceBase: { kind: "directory", path: ASSETS_BASE.path + s.dir },
		rank: RANK,
		locator: new URL(\`../assets/\${s.dir}/SKILL.md\`, import.meta.url),
	}))),
	async get(candidate) {
		const s = SKILLS.find((item) => item.name === candidate?.name);
		if (s === void 0) throw new Error(\`unknown skill: \${String(candidate?.name)}\`);
		return {
			name: s.name,
			description: s.description,
			invocation: { modelInvocable: true, userInvocable: true },
			provider: PROVIDER_NAME,
			source: "bundled",
			resourceBase: { kind: "directory", path: ASSETS_BASE.path + s.dir },
			content: await readFile(new URL(\`../assets/\${s.dir}/SKILL.md\`, import.meta.url), "utf8"),
		};
	},
};

/** Cordis 插件名 */
export const name = "${PLUGIN_ID}";
/** 所需服务 */
export const inject = ["skills"];
/** 在 ctx.skills 上注册打包技能提供者 */
export function apply(ctx) {
	ctx.skills.registerProvider(() => provider);
}
`;
await writeFile(join(OUT, "lib", "index.js"), js);

// package.json —— 仅 Host 侧 bundle：patch + 图标 + locale，无 UI 模块
const pkg = {
  name: PKG_NAME,
  description: "Loads zcode design skills (GSAP ×8, react-bits, design-taste-frontend) into DeepSeek Harness agents.",
  version: "0.1.0",
  type: "module",
  main: "lib/index.js",
  exports: {
    ".": "./lib/index.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
  },
  files: ["lib/index.js", "cordis.patch.yml", "locale/*.json", "icon.svg", "assets"],
  icon: "./icon.svg",
  dsh: { bundle: { patch: "./cordis.patch.yml" } },
  license: "MIT",
};
await writeFile(join(OUT, "package.json"), JSON.stringify(pkg, null, "\t") + "\n");

// cordis.patch.yml —— 把插件行插入组合树
await writeFile(join(OUT, "cordis.patch.yml"),
`- insert:
    - id: ${PLUGIN_ID}
      name: ${PKG_NAME}
`);

// locale —— 插件列表页显示用
await writeFile(join(OUT, "locale", "en.json"), JSON.stringify({
  meta: {
    title: "Zcode Design Skills",
    description: "Bundles 10 design skills: 8 official GSAP skills, react-bits, and design-taste-frontend.",
  },
}, null, "\t") + "\n");
await writeFile(join(OUT, "locale", "zh.json"), JSON.stringify({
  meta: {
    title: "Zcode 设计技能包",
    description: "装载 10 个设计类技能：8 个官方 GSAP 技能、react-bits 与 design-taste-frontend。",
  },
}, null, "\t") + "\n");

// 图标 —— 原创调色板图形
await writeFile(join(OUT, "icon.svg"),
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#4D6BFE"/>
  <path d="M32 14c-10.5 0-19 7.6-19 17 0 9.3 8.5 16.9 19 16.9 2.7 0 4.6-1.9 4.6-4.2 0-1.2-.5-2.2-1.3-3-.7-.7-1.2-1.5-1.2-2.5 0-2 1.6-3.6 3.7-3.6h4.3c6.5 0 11.9-4.6 11.9-10.4C53 19.6 43.6 14 32 14zm-11 12a3.6 3.6 0 110 7.2 3.6 3.6 0 010-7.2zm8-6a3.6 3.6 0 110 7.2 3.6 3.6 0 010-7.2zm12 0a3.6 3.6 0 110 7.2 3.6 3.6 0 010-7.2zm9 7a3.6 3.6 0 110 7.2 3.6 3.6 0 010-7.2z" fill="#fff"/>
</svg>
`);

// README
await writeFile(join(OUT, "README.md"),
`# ${PKG_NAME}

把 zcode 的 10 个设计类 skills 装载进 DeepSeek Harness：

- GSAP 官方技能 ×8：gsap-core / frameworks / performance / plugins / react / scrolltrigger / timeline / utils
- react-bits：动画 React 组件库（含 Vite / Tailwind v4 / Three.js / GSAP / Framer Motion 集成）
- design-taste-frontend（taste-skill v2）：反模板化前端美术方向技能

来源仓库：
- https://github.com/greensock/gsap-skills
- https://github.com/DavidHDev/react-bits
- https://github.com/Leonxlnx/taste-skill

安装（DSH 关闭时）：\`dsh plugin --profile desktop add D:\\dsh-plugins\\dsh-zcode-design-skills --save-exact\`
然后把包名加入 profile \`package.json\` 的 \`dsh.profile.bundles\`，重启 DSH 即可。
技能以 \`/gsap-core\` 等 slash 命令或模型自动路由调用。
`);

console.log(`\n完成：${OUT}`);
