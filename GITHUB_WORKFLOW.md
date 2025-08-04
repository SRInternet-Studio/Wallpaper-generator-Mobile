# GitHub Actions 发布工作流

本文档描述了为本项目配置的 GitHub Actions 工作流，该工作流位于 `.github/workflows/release.yml` 文件中。

## 概述

此工作流的主要目的是自动化 Tauri 安卓应用程序的构建和发布流程。当被触发时，它会构建安卓 APK 文件，并将其附加到 GitHub Release 中。

## 工作原理

该工作流执行以下步骤：

1.  **环境设置**: 设置一个 Ubuntu 环境，并安装 Tauri 安卓构建所需的所有工具，包括：
    *   Bun (JavaScript 运行时和包管理器)
    *   Java (JDK 17)
    *   Android SDK 和 NDK
    *   带有安卓编译目标的 Rust 工具链

2.  **缓存依赖**: 为了加速构建，工作流会缓存以下依赖：
    *   Rust (cargo) 依赖
    *   Bun 依赖
    *   Android NDK 和 Gradle 依赖

3.  **安装依赖**: 使用 `bun install` 命令安装项目的前端依赖。

3.  **构建 APK**: 构建两个版本的安卓应用程序：
    *   一个 **通用 (universal)** APK，可在大多数安卓设备上运行。
    *   一个 **ARM64** APK，为 64 位 ARM 设备优化。

4.  **上传到 Release**: 生成的 APK 文件会自动作为附件上传到触发此工作流的 GitHub Release 中。

## 如何触发工作流

您可以通过以下两种方式触发此工作流：

1.  **手动触发**: 在您的 GitHub 仓库页面，导航到 "Actions" 标签页，从工作流列表中选择 "Release Tauri App"，然后点击 "Run workflow"。
2.  **自动触发**: 在 GitHub 上创建并发布一个新的 **Release**。工作流将自动启动，构建应用，并将 APK 上传到该新版本中。

## 必要配置

为了让工作流成功执行，您 **必须** 在您的 GitHub 仓库设置中配置以下机密信息 (`Settings` > `Secrets and variables` > `Actions`)：

### 必需的机密信息 (Secrets)

*   `TAURI_SIGNING_PRIVATE_KEY`: 用于为 Tauri 应用程序包签名的私钥。
*   `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 私钥的密码（如果它被加密了）。

### 可选（推荐用于已签名的 APK）

当前工作流已支持 **可选的 APK 签名**。

*   **如果未提供** 下列安卓签名密钥，工作流将生成 **未签名** 的 APK。
*   **如果提供了** 下列安卓签名密钥，工作流将自动使用它们来生成 **已签名** 的、可直接发布的 APK。

要启用签名，请添加以下机密信息：
*   `ANDROID_KEY_BASE64`: 您的安卓密钥库 (keystore) 文件，经过 Base64 编码。
*   `ANDROID_KEY_ALIAS`: 您的签名密钥别名。
*   `ANDROID_KEY_PASSWORD`: 您的密钥库和密钥别名的密码。

---

## 如何获取机密信息 (Secrets)

下面是获取上述机密信息的方法。

### 1. Tauri 签名密钥

这些密钥用于为 Tauri 应用本身签名。

*   **生成密钥**: 如果您还没有密钥，可以在项目根目录运行以下命令来生成一个新的密钥对：
    ```sh
    bun run tauri signer generate
    ```
    这会提示您输入一个密码，这个密码就是 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。命令执行后会生成一个公钥和一个私钥文件。

*   **`TAURI_SIGNING_PRIVATE_KEY`**:
    *   这是您私钥文件的 **内容**，而不是文件路径。
    *   私钥文件通常保存在 `~/.tauri/` 或你指定的路径下。
    *   使用文本编辑器打开私钥文件（例如 `private.key`），将其中的 **所有内容** 复制出来，粘贴到 GitHub Secret 中。

*   **`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`**:
    *   这是您在生成密钥时设置的密码。

### 2. 安卓签名密钥 (可选)

这些密钥用于为最终的 APK 文件签名，以便发布到应用商店。

*   **生成密钥库 (Keystore)**: 如果您还没有安卓签名密钥库，可以使用 Java 的 `keytool` 命令来生成。请确保已安装 Java 环境。
    ```sh
    keytool -genkey -v -keystore my-release-key.jks -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
    ```
    在执行过程中，您会被要求设置密钥库的密码和密钥的别名。

*   **`ANDROID_KEY_ALIAS`**:
    *   您在上述命令中为 `-alias` 参数提供的值（例如 `my-key-alias`）。

*   **`ANDROID_KEY_PASSWORD`**:
    *   您在生成密钥库时设置的密码。

*   **`ANDROID_KEY_BASE64`**:
    *   这是您的密钥库文件 (`.jks` 文件) 经过 Base64 编码后的字符串。
    *   在不同操作系统上，`base64` 命令的用法略有不同。
    *   **在 macOS 上**，您需要使用 `-i` 标志来指定输入文件：
        ```sh
        base64 -i my-release-key.jks
        ```
    *   **在 Linux 系统上**，命令通常是：
        ```sh
        base64 my-release-key.jks
        ```
    *   将命令输出的 **整段字符串** 复制并粘贴到 GitHub Secret 中。
