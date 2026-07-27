# skill管理器

一个本地 Codex Skill 管理 MVP，用来查看、搜索、开启和关闭 `C:\Users\29636\.codex\skills` 里的 skills。

## 已实现功能

- 自动扫描本机 Codex skills 目录。
- 展示 skill 名字、中文功能摘要、分类、使用方式、详情和开关状态。
- 没有版本号的 skill 默认显示 `V1.0`。
- 对 `mattpocock/skills` 里的 skill 自动显示仓库：`https://github.com/mattpocock/skills`。
- 支持搜索、状态筛选和分类筛选。
- 功能和作用默认只显示前两段中文摘要，过长信息隐藏在“展开详情”里。
- 分类分为“系统内置”和“用户安装”。
- 使用方式会提示 `/命令`、skill 名称调用方式或相关关键词。
- 绿色开关表示开启，灰色开关表示关闭。
- 关闭 skill 时不会删除文件，只会把：

```text
SKILL.md
```

安全改名为：

```text
SKILL.disabled.md
```

重新开启时再改回 `SKILL.md`。

## 重要安全规则

- 本软件不使用批量删除。
- 本软件不删除 skill 目录。
- 系统内置 `.system` skills 默认保护，MVP 不允许关闭。
- 开关修改后，建议新开 Codex 任务或重启 Codex 才能稳定生效。

## 启动方式

双击：

```text
C:\Users\29636\Documents\Codex\2026-07-23\hu\skill-manager\启动skill管理器.bat
```

或者在此目录运行：

```powershell
npm start
```

项目目录：

```text
C:\Users\29636\Documents\Codex\2026-07-23\hu\skill-manager
```

## 自动跟随 Codex 打开

MVP 已提供一个监听脚本。双击：

```text
C:\Users\29636\Documents\Codex\2026-07-23\hu\skill-manager\启动自动监听.bat
```

它会在后台循环检测 Codex/ChatGPT 进程；检测到后自动打开 `skill管理器`。关闭监听窗口即可停止。

> 如果你希望它开机自动监听，后续可以再把这个 `.bat` 加到 Windows 启动项或任务计划程序。当前版本不会擅自修改你的系统启动项。

## 仅测试扫描

```powershell
npm run scan
```

## 后续可升级方向

- 把监听器注册到 Windows 启动项。
- 增加推荐保留/删除配置模板。
- 增加 skill 分组、备注、来源编辑。
- 增加真正的 Codex 插件形态。

## v1.2 维修说明

本版本完成了第一阶段 + 第二阶段基础版：

1. 界面不再依赖横向滚动条：表格使用固定布局和自动换行，长路径、GitHub、说明文字会在单元格内折行。
2. 软件文字 CSS 统一指定为 `思源宋体`，包括按钮、输入框、表格、代码路径和详情内容。
3. 从 Codex 专用改为 Agent 通用基础版：默认保留 Codex 配对，同时可以新增其他 Agent 配对。
4. Agent 配对配置文件位置：`data/agent-profiles.json`。
5. 基础版支持的开关方式：通过 `SKILL.md` 与 `SKILL.disabled.md` 重命名来开启/关闭 skill。

### Agent 配对使用方式

打开软件后，在顶部“Agent 配对”区域填写：

- Agent 名称：例如 `Codex`、`Claude`、`Cursor`。
- Skills 目录：该 Agent 存放 skills 的目录。
- 启用文件名：默认 `SKILL.md`。
- 关闭文件名：默认 `SKILL.disabled.md`。
- 系统目录名：默认 `.system`。

点击“保存并使用”后，软件会切换到这个 Agent 的 skills 目录并重新扫描。

## v1.3 界面维修说明

本版本隐藏了主界面的 Agent 配对表单，底层配对配置仍保留在 `data/agent-profiles.json`。

同时窗口改为 Electron 无边框模式：

- 去掉 Windows 原生标题栏。
- 去掉 `File / Edit / View / Window / Help` 菜单栏。
- 增加软件内部的最小化、最大化/还原、关闭按钮。
- 顶部自定义窗口栏支持拖动窗口。

修改后需要关闭旧窗口并重新打开软件才能看到新版界面。
