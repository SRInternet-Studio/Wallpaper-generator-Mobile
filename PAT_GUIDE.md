# 如何创建用于壁纸生成器的 GitHub 个人访问令牌 (PAT)

为了解决访问图片源市场时可能遇到的 GitHub API 速率限制问题，您可以创建一个个人访问令牌 (PAT) 并配置在应用中。

这个过程是安全的，因为我们将创建一个权限极小化的令牌，它只能读取公开仓库的信息。

## 步骤

1.  **访问 GitHub 令牌创建页面**
    *   点击此链接直接跳转到创建 **Fine-grained personal access token** 的页面：
        [https://github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta)

2.  **填写令牌信息**
    *   **Token name**: 给你的令牌起一个容易识别的名字，例如 `WallpaperGeneratorPAT`。
    *   **Expiration**: 选择一个过期时间。为了安全，建议不要选择 `No expiration`。`90 days` 是一个不错的选择。
    *   **Description**: (可选) 添加一个描述，例如 `用于壁纸生成器 App 提高 API 速率限制`。
    *   **Resource owner**: 保持默认，即你自己的账户。

3.  **配置仓库访问权限**
    *   在 **Repository access** 部分，选择 **Public Repositories (read-only)**。
    *   这将授予该令牌读取**所有**公开仓库的权限，这对于我们访问图片源市场来说是必需的，同时也是一个非常安全的最小化权限。

4.  **配置权限 (Permissions)**
    *   **不要**修改任何默认的权限设置。我们只需要最基础的读取权限，而这在第 3 步已经默认授予了。

5.  **生成令牌**
    *   点击页面底部的 **Generate token** 按钮。

6.  **复制并保存令牌**
    *   **重要**: 在新生成的令牌页面，立即点击复制按钮，将你的令牌 (以 `ghp_` 开头) 复制下来。**这个令牌只会显示一次**，离开页面后将无法再次查看。
    *   将复制的令牌粘贴到壁纸生成器 App 的设置页面的输入框中，并点击保存。

现在，你已经成功创建并配置了 PAT，可以无限制地访问图片源市场了！
