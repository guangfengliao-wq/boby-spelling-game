# 英文拼写练习 · Boby Spelling Game

面向小学英语学习的单词练习应用：按学期和单元学习词汇，通过“看中文、拼英文”进行默写，结合错题复习和学习记录巩固记忆。支持浏览器运行，也可以打包为 Android APK 安装到平板。

## 主要功能

- **单词学习**：选择学期和单元，查看英文、中文释义并收听发音。
- **拼写默写**：默认每轮抽取最多 10 个单词，也可在设置中切换为单元全部单词；支持继续未完成的练习。
- **错题复习**：记录拼写错误的单词，方便后续针对性练习。
- **学习记录**：查看积分、连胜与生涯默写记录。
- **音标学习**：学习音标、收听音标和例词发音；音标模式不参与默写。
- **本地音频**：单词和音标录音随应用提供，APK 播放发音不依赖联网语音服务。
- **PWA 支持**：配置了应用清单和资源缓存，可在支持的浏览器中安装使用。

学习数据保存在当前浏览器或应用的本地存储中，当前没有账号系统或跨设备同步。清除站点数据、卸载应用或主动重置记录会丢失相应本地数据。

## 快速开始

准备 Git、Node.js 22 或更高版本及 npm。仅运行网页版不需要 Java 或 Android SDK。

```bash
git clone https://github.com/guangfengliao-wq/boby-spelling-game.git
cd boby-spelling-game
npm ci
npm run dev
```

在浏览器打开终端显示的地址，默认是 `http://localhost:5173`。端口被占用时以终端输出为准。

进入首页后选择已包含词汇的学期，再选择“学习”或“默写”。部分学期可能尚未补充词表，页面会显示提示。

## 常用命令

以下命令均在项目根目录执行。

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按 `package-lock.json` 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run audio:check` | 检查单词及音标音频覆盖 |
| `npm run build` | 检查音频、执行 TypeScript 类型检查并构建到 `dist/` |
| `npm run preview` | 本地预览已生成的网页构建产物，需先执行 build |
| `npm run pack` | 递增版本号、构建网页并生成 Android 调试 APK，启动二维码分享 |
| `npm run share` | 启动或复用已有 APK 的局域网下载服务，重新生成二维码 |
| `npm run release` | 上传当前版本 APK 到 GitHub Releases，并生成远程下载二维码 |
| `npm run release -- --dry-run` | 仅检查本地待发布文件，不联网、不上传 |

预览生产构建：

```bash
npm run build
npm run preview
```

网页使用 Vue Router 的 History 路由。部署时需要让页面路由回退到 `index.html`；当前路径按站点根目录配置，部署到子目录前需要相应调整 Vite、路由和 PWA 配置。上传源码到 GitHub 本身不会自动发布网页。

## Android 打包与安装

除 Node.js 外，准备 JDK 21，以及 Android SDK 的 API 36、Build-Tools 35.0.0 和 Platform-Tools。首次构建需要联网下载 Gradle 和 Maven 依赖。

```bash
npm run pack
```

成功后生成：

```text
release/
├── english-spelling-v<版本号>.apk # 带版本号的调试 APK，用于发布
├── english-spelling.apk   # 最新成功构建的副本，兼容局域网下载链接
├── install-qr.png         # 局域网下载安装二维码
└── install.html           # 二维码安装页面
```

电脑和平板连接同一局域网，保持电脑开机，扫码下载并按 Android 提示安装。下载服务默认使用端口 `5180`；电脑重启或网络变化后可运行 `npm run share`。也可通过 USB 复制 APK 安装。

**版本号行为**：每次运行 `npm run pack` 都会先递增补丁版本和 Android `versionCode`，即使后续构建失败也会保留递增。单独执行 `build` 或 `share` 不递增版本。

输出为调试 APK；正式发布需要另行配置发布签名。覆盖安装应保持签名一致，以便保留学习记录。完整环境配置、签名说明及故障排查见 [APK 打包指南](APK_BUILD_GUIDE.md)。

## 发布 APK 到 GitHub

`pack`、`build`、`share` 均不会上传 APK。需要发布时，先运行 `npm run pack`，将版本号及代码修改提交并 `git push`，然后执行：

```bash
npm run release
```

命令读取 `package.json` 的版本和 `origin` 仓库，上传对应的 `release/english-spelling-v<版本号>.apk`，创建 `v<版本号>` Release；不会重新打包或递增版本。需先通过 Git 凭据管理器登录有仓库写入权限的 GitHub 账号，也可使用 `GH_TOKEN` 或 `GITHUB_TOKEN` 环境变量。不要把令牌写入代码或提交到 Git。

上传校验成功后才发布新建的草稿。重复执行时相同附件会复用，内容不同的同名附件不会被覆盖。发布成功后在终端显示远程二维码，并生成 `release/github-install-v<版本号>.png` 和 `.html`，与局域网二维码分开保存。

远程二维码指向 GitHub 上带版本号的 APK 下载链接，无需电脑开机或同一 Wi-Fi；扫码设备需能访问 GitHub，私有仓库还需要登录权限。此链接固定对应本次版本。二维码生成失败时可重跑命令，已上传的相同 APK 不会重复上传。

## 技术栈与目录

项目使用 Vue 3、TypeScript、Vue Router 4、Vite 5、vite-plugin-pwa 和 Capacitor 8。

```text
android/                 # Android 原生工程与 Gradle 配置
public/
├── assets/              # 图片、背景音乐等静态资源
└── audio/               # 单词与音标音频及来源说明
scripts/                 # 音频维护、校验、打包、分享及测试脚本
src/
├── assets/              # 全局样式
├── components/          # 学期选择器、设置弹窗等共用组件
├── composables/         # 游戏、学习、设置和用户状态
├── data/                # 词库、音标数据与音频映射
├── pages/               # 首页、学习、默写、错题、生涯等页面
├── router/              # 页面路由
└── utils/               # 词库读取、本地存储、音频播放等工具
APK_BUILD_GUIDE.md       # Android 打包与音频维护详细说明
capacitor.config.ts     # Android 应用标识及网页产物目录
vite.config.ts          # 开发服务器、构建和 PWA 配置
```

`node_modules/`、`dist/`、`release/`、本地缓存、环境变量文件和签名密钥不提交到 Git。当前 `doc/` 是本地文档目录，也不包含在仓库中。

## 应用内检查更新

在设置中点击“检查更新”，应用会读取本仓库最新的公开正式 Release。发现更高版本后展示更新公告和安装包大小，确认后打开系统浏览器下载 APK，再由用户按 Android 提示覆盖安装。当前采用完整 APK 更新，不是网页资源热更新，也不会静默安装。

发布前修改根目录 `RELEASE_NOTES.md`，`npm run release` 会将其内容加入新建 Release 的公告。已发布版本的公告可在 GitHub Release 页面编辑。检查更新需要联网访问 GitHub；私有仓库不支持此匿名检查流程。覆盖安装需保持相同应用 ID 和签名，已有 v0.1.2 需先手动安装一次带此功能的新版。

## 修改词库与音频

词库位于 `src/data/words.json`，按 `semesters → units → words` 组织。每个单词包含 `en`（英文）和 `cn`（中文释义）；学期和单元使用独立的 `id` 与 `name`。修改时保留现有 ID，避免影响已有学习记录的对应关系。

单词音频映射位于 `src/data/wordAudio.json`，对应文件放在 `public/audio/words/`。新增英文词条后，需要补齐音频，再执行：

```bash
npm run audio:check
npm run build
```

需要生成新词音频时，可按 [APK 打包指南中的音频说明](APK_BUILD_GUIDE.md#内置英语发音) 操作。生成器会将英语词条发送到微软 Edge 语音服务，需要联网；正常运行及普通构建不会调用该服务。

## 开发检查

提交功能修改前建议执行 `npm run build`。按修改范围，还可以运行已有的专项检查：

```bash
node scripts/test-word-audio.mjs
node scripts/test-dictation-scope.mjs
node --test scripts/bump-pack-version.test.mjs
node --test scripts/release.test.mjs
```

这些脚本分别检查音频播放器生命周期、默写范围设置、打包版本递增，以及发布流程与远程二维码。发布测试使用模拟接口，不会上传文件。界面修改还应通过 `npm run dev` 检查实际交互；Android 相关修改需在设备上验证。

## 音频来源与授权

音标素材包含第三方录音，其来源和授权说明见：

- [BBC 音标录音说明](public/audio/phonetics/bbc/ATTRIBUTION.txt)
- [其他音标录音说明](public/audio/phonetics/ATTRIBUTION.txt)

BBC 录音的版权归 BBC 所有，不属于其他音源的 MIT 许可范围。当前仓库没有为整个项目提供统一的 LICENSE 文件；公开可读不代表所有代码和素材均可自由再分发，复用时请分别确认相关授权。
