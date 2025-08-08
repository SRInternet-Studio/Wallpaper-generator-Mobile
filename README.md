# 壁纸生成器 NEXT - 手机版
#### (Tauri + React + TypeScript)

<p>
<img src="https://img.shields.io/github/languages/top/SRInternet-Studio/Wallpaper-generator-Mobile" alt="Language">
<img src="https://img.shields.io/badge/FREE-100%25-brightgreen" alt="FREE">
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/SRInternet-Studio/Wallpaper-generator-Mobile?label=%E6%AD%A3%E5%BC%8F%E7%89%88">
<img alt="GitHub Release" src="https://img.shields.io/github/v/release/SRInternet-Studio/Wallpaper-generator-Mobile?include_prereleases&label=%E9%A2%84%E8%A7%88%E7%89%88">
<img src="https://img.shields.io/github/stars/SRInternet-Studio/Wallpaper-generator-Mobile" alt="Stars">
<img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/SRInternet-Studio/Wallpaper-generator-Mobile/total?style=social&logo=github&label=%E4%B8%8B%E8%BD%BD%E9%87%8F">
</p>

这是一个使用 Tauri 框架构建的跨平台桌面和移动应用，旨在提供一个灵活的壁纸生成和管理工具。应用的核心是通过一个可扩展的“图片源市场”来获取和配置不同的图片 API，从而动态生成和下载壁纸。

> [!Important]
>
> 我们正在逐步从[旧存储库1](https://github.com/SRInternet/Wallpaper-generator-for-Android/)和[旧存储库2](https://github.com/SRInternet-Studio/Wallpaper_Generator_PE/)转移资源和内容到本存储库，并进行重构，目前可能还存在一些信息遗漏和丢失的情况。若您确定你发现了问题，或想要提出建议，欢迎[查阅和提出新的 issue ](https://github.com/SRInternet-Studio/Wallpaper-generator-Mobile/issues)

## ✨ 功能特性

- **图片源市场**: 动态从远程仓库加载可用的图片源 API，以卡片形式清晰展示。
- **动态生成器**: 根据所选图片源的配置，自动生成包含滑块、开关、下拉菜单等控件的参数配置表单。
- **图片生成**: 调用外部 API，根据用户配置的参数生成图片，并在应用内展示结果。
- **图片下载**: 支持将生成的图片一键下载并保存到本地指定目录。
- **个性化设置**: 提供设置页面，允许用户通过原生对话框自定义图片的默认保存路径。
- **跨平台**: 基于 Tauri 构建，可轻松打包为 Windows, macOS, Linux, Android 和 iOS 应用。

## 🛠️ 技术栈

- **核心框架**: [Tauri](https://tauri.app/) (v2)
- **前端**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Material-UI (MUI)](https://mui.com/)
- **路由**: [React Router](https://reactrouter.com/)
- **包管理器**: [Bun](https://bun.sh/)

## 🚀 快速开始

### 1. 安装依赖

确保你已经安装了 [Node.js](https://nodejs.org/), [Rust](https://www.rust-lang.org/) 和 [Bun](https://bun.sh/)。然后，在项目根目录下运行以下命令来安装项目依赖：

```sh
bun install
```

### 2. 运行桌面版 (开发模式)

```sh
bun run tauri dev
```

## 📱 安卓开发设置

在本地运行或构建安卓应用之前，您需要先设置好开发环境。

### 1. 安装安卓开发依赖

请遵循 Tauri 官方文档的指引来安装安卓开发所需的全部依赖，包括 Java、Android SDK 和 NDK。

- [Tauri 安卓开发环境设置文档](https://tauri.app/v2/guides/getting-started/prerequisites#android)

### 2. 初始化安卓项目

如果尚未操作，请在项目根目录下运行以下命令，它会在 `src-tauri` 目录下生成安卓项目所需的文件：

```sh
bun run tauri android init
```

### 3. 在设备上运行开发版本

连接您的安卓设备（或启动一个安卓模拟器），然后运行以下命令来启动开发模式：

```sh
bun run tauri android dev
```

## 📦 自动化安卓发布

本项目已配置 GitHub Actions 工作流，用于自动构建和发布安卓应用。

当在 GitHub 上发布新版本时，工作流将自动：
1.  构建安卓 APK 文件（通用版和 arm64 版）。
2.  将生成的 APK 文件附加到该 GitHub Release 中。

关于工作流的详细工作原理、如何触发以及如何配置所需密钥的详细信息，请参阅 [**GitHub Actions 工作流文档**](./GITHUB_WORKFLOW.md)。
