# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 本地安卓开发设置

在本地运行或构建安卓应用之前，您需要先设置好开发环境。

### 1. 安装依赖

请遵循 Tauri 官方文档的指引来安装安卓开发所需的全部依赖，包括 Java、Android SDK 和 NDK。

- [Tauri 安卓开发环境设置文档](https://tauri.app/v2/guides/getting-started/prerequisites#android)

### 2. 初始化安卓项目

在项目根目录下运行以下命令，它会在 `src-tauri` 目录下生成安卓项目所需的文件：

```sh
bun run tauri android init
```

### 3. 在设备上运行开发版本

连接您的安卓设备（或启动一个安卓模拟器），然后运行以下命令来启动开发模式：

```sh
bun run tauri android dev
```

## 自动化安卓发布

本项目已配置 GitHub Actions 工作流，用于自动构建和发布安卓应用。

当在 GitHub 上发布新版本时，工作流将自动：
1.  构建安卓 APK 文件（通用版和 arm64 版）。
2.  将生成的 APK 文件附加到该 GitHub Release 中。

关于工作流的详细工作原理、如何触发以及如何配置所需密钥的详细信息，请参阅 [**GitHub Actions 工作流文档**](./GITHUB_WORKFLOW.md)。
