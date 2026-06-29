# 🚀 推送到 GitHub - 快速指南

## 📋 你需要做的事情（2 步）

### 步骤 1️⃣：在 GitHub 上创建仓库（2 分钟）

1. **打开创建仓库页面**
   - 访问：https://github.com/new
   - 或：登录 GitHub → 右上角 "+" → "New repository"

2. **填写信息**（按照下图）
   ```
   Repository name: nce
   Description: NCE-Flow-Plus - 新概念英语在线点读（增强版），支持句子跟读与发音评分
   Public/Private: 选择 Public（推荐）
   
   ⚠️ 重要：不要勾选以下选项（我们已经有了）
   ❌ Initialize this repository with a README
   ❌ Add .gitignore
   ❌ Add license
   ```

3. **点击 "Create repository"**

4. **复制仓库 URL**
   - 创建成功后会看到类似这样的页面
   - 复制类似这样的 URL：
   ```
   https://github.com/yepingguan-web/nce.git
   ```

---

### 步骤 2️⃣：推送代码（复制粘贴以下命令）

**打开终端**，然后**一条一条**运行以下命令：

```bash
# 1. 进入项目目录
cd /Users/mark/.qclaw/workspace/nce-project

# 2. 添加远程仓库（替换成你的仓库 URL）
git remote add origin https://github.com/yepingguan-web/nce.git

# 3. 验证远程仓库
git remote -v

# 应该看到：
# origin  https://github.com/yepingguan-web/nce.git (fetch)
# origin  https://github.com/yepingguan-web/nce.git (push)

# 4. 推送代码到 GitHub
git push -u origin main
```

**首次推送会要求登录 GitHub**：

#### 方法 A：浏览器自动弹出登录（推荐）
- 会自动打开浏览器
- 登录你的 GitHub 账号
- 点击 "Authorize"
- 等待推送完成

#### 方法 B：要求输入用户名和密码
- **Username**: 输入你的 GitHub 用户名（yepingguan-web）
- **Password**: ⚠️ 不是你的 GitHub 密码！
  - 需要使用 **Personal Access Token**
  - 如何创建 Token：https://github.com/settings/tokens/new
  - 勾选 `repo` 权限
  - 生成后复制 token，当作密码输入

---

## ✅ 推送成功后

1. **访问你的仓库**
   - 打开：https://github.com/yepingguan-web/nce
   - 应该能看到所有文件

2. **查看 README**
   - README.md 会自动显示在仓库首页

3. **测试本地运行**
   ```bash
   cd /Users/mark/.qclaw/workspace/nce-project
   ./start-server.sh
   ```
   - 打开：http://localhost:8000
   - 点击 "Lesson 1" 进入课文页
   - 点击任意句子的 "🎤 跟读" 按钮测试功能

---

## 🔧 如果遇到问题

### 问题 1：推送失败，提示 "error: failed to push some refs"

**原因**：GitHub 仓库中有本地没有的文件

**解决方案**：
```bash
# 先拉取远程更新
git pull origin main --allow-unrelated-histories

# 如果有冲突，解决后再次推送
git push -u origin main
```

### 问题 2：忘记创建 Personal Access Token

**解决方案**：
1. 访问：https://github.com/settings/tokens/new
2. **Note**: `Git operations`
3. **Expiration**: `90 days`
4. **勾选权限**: `repo` (全部子选项)
5. 点击 "Generate token"
6. **复制 token**（只显示一次！）
7. 再次推送时，密码填这个 token

### 问题 3：提示 "remote origin already exists"

**解决方案**：
```bash
# 删除现有的远程仓库
git remote remove origin

# 重新添加
git remote add origin https://github.com/yepingguan-web/nce.git
```

---

## 🎯 推送完成后你可以做的

1. **启用 GitHub Pages**（免费托管）
   - 访问：https://github.com/yepingguan-web/nce/settings/pages
   - Source: 选择 `main`
   - 点击 Save
   - 几分钟后访问：https://yepingguan-web.github.io/nce/

2. **添加课程数据**
   - 把 NCE 四册的音频和文本文件放到对应目录
   - 提交并推送：`git add . && git commit -m "Add lesson data" && git push`

3. **配置 Docker 自动构建**
   - 我可以帮你创建 `.github/workflows/docker.yml`
   - 每次 push 自动构建并推送 Docker 镜像

---

## 💡 快速命令参考

```bash
# 查看项目状态
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述你的修改"

# 推送到 GitHub
git push

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v
```

---

## 🆘 需要帮助？

把以下信息告诉我：
- ❌ 错误信息是什么？
- 🔧 运行了什么命令？
- 💭 你期望的结果是什么？

我会帮你解决！💪

---

**准备好了吗？** 按照上面的步骤操作，完成后告诉我结果！🚀
