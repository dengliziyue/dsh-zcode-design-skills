# dsh-zcode-design-skills

> English: A DeepSeek Harness plugin that bundles 10 frontend-design agent skills — 8 official GSAP skills, react-bits, and design-taste-frontend — exposed through the Harness skill provider registry.

把 10 个设计类 skills 装载进 DeepSeek Harness（DSH），让 agent 直接调用：

| 技能 | 内容 |
|---|---|
| `gsap-core` | GSAP 核心 API：tween、easing、stagger、matchMedia（响应式/减少动效） |
| `gsap-timeline` | 时间线编排：position 参数、嵌套、播放控制 |
| `gsap-scrolltrigger` | 滚动驱动动画：pinning、scrub、视差 |
| `gsap-plugins` | 插件全家桶：ScrollTo、Flip、Draggable、SplitText 等 |
| `gsap-react` | React/Next.js：useGSAP、refs、context、卸载清理 |
| `gsap-frameworks` | Vue/Svelte/SvelteKit 生命周期与作用域 |
| `gsap-utils` | gsap.utils：clamp、mapRange、snap、toArray 等 |
| `gsap-performance` | 性能：transform 优先、避免布局抖动、60fps |
| `react-bits` | 动画 React 组件库（Vite / Tailwind v4 / Three.js / GSAP / Framer Motion） |
| `design-taste-frontend` | taste-skill v2：反模板化前端美术方向（247 个获奖站点研究） |

## 安装

**方式一（推荐）—— 用官方 CLI 从 npm 安装**（发布到 npm 后）：

```powershell
dsh plugin --profile desktop add dsh-zcode-design-skills --save-exact
```

**方式二 —— 从本仓库构建安装**（DSH 关闭时）：

```powershell
# 1. 构建出 npm 包（输出到 ./dsh-zcode-design-skills）
node build.mjs <你的 .agents/skills 目录> <输出目录>

# 2. 打包并安装
cd dsh-zcode-design-skills
npm pack
dsh plugin --profile desktop add ..\dsh-zcode-design-skills-0.1.0.tgz --save-exact
```

CLI 的 pnpm 包装层会自动把 `dsh-zcode-design-skills` 登记进 profile `package.json` 的 `dsh.profile.bundles`。重启 DSH 生效。

**方式三 —— 通过 dshmarket 市场**：打包 tarball 或 npm 发布后，可在市场里以 spec 安装。

## 调用

装好后技能自动出现在 Harness 会话中：

- 斜杠命令：`/gsap-core`、`/gsap-scrolltrigger`、`/design-taste-frontend` …
- 模型自动路由：做动画/落地页/设计任务时按 description 自动匹配

## 出处与许可

| 上游 | 许可 |
|---|---|
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | MIT |
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | MIT + Commons Clause v1.0（禁止售卖，允许免费再分发） |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT |

`assets/` 内的技能内容来自上述上游仓库，版权归原作者；本仓库的打包代码（`lib/index.js`、`build.mjs`、补丁与 locale）以 MIT 许可发布（见 [LICENSE](LICENSE)）。react-bits 内容遵循其 MIT + Commons Clause 条款随仓库免费分发。

## 仓库结构

```
├── build.mjs           # 从本地 .agents/skills 目录构建插件包
├── cordis.patch.yml    # bundle 补丁：把插件行插入组合树
├── icon.svg            # 插件图标
├── lib/index.js        # 技能提供者（ctx.skills.registerProvider）
├── locale/             # en / zh 展示元数据
└── assets/             # 10 个技能的完整内容（SKILL.md + 资源）
```
