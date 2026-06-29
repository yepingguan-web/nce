# 🚀 推送到 GitHub 指南

## 📋 步骤概览

1. ✅ 在 GitHub 上创建仓库 `nce`
2. ✅ 连接本地仓库到 GitHub
3. ✅ 推送代码

---

## 步骤 1️⃣：在 GitHub 上创建仓库

### 方法 A：通过 GitHub 网页（推荐）

1. **访问 GitHub**
   - 打开：https://github.com/new
   - 或者：登录 GitHub → 点击右上角 "+" → "New repository"

2. **填写仓库信息**
   - **Repository name**: `nce`
   - **Description**: `NCE-Flow-Plus - 新概念英语在线点读（增强版），支持句子跟读与发音评分`
   - **Public/Private**: 选择你想要的（建议 Public，这样别人也能看到）
   - ⚠️ **不要**勾选 "Initialize this repository with a README"（我们已经有了）
   - ⚠️ **不要**添加 .gitignore 或 license（我们已经有了）

3. **点击 "Create repository"**

4. **复制仓库 URL**
   - 创建成功后会看到类似这样的页面：
   ```
   https://github.com/yepingguan-web/nce.git
   ```
   - 复制这个 URL，下一步会用到

---

## 步骤 2️⃣：连接本地仓库到 GitHub

在终端中运行以下命令（替换为你的仓库 URL）：

```bash
# 进入项目目录
cd /Users/mark/.qclaw/workspace/nce-project

# 添加远程仓库
git remote add origin https://github.com/yepingguan-web/nce.git

# 验证远程仓库
git remote -v
```

应该看到类似这样的输出：
```
origin  https://github.com/yepingguan-web/nce.git (fetch)
origin  https://github.com/yepingguan-web/nce.git (push)
```

---

## 步骤 3️⃣：推送代码到 GitHub

### 方法 A：使用 HTTPS（推荐给新手）

```bash
# 推送 main 分支到 origin
git push -u origin main
```

**首次推送会要求登录 GitHub**：
- 如果是浏览器弹出登录窗口 → 登录即可
- 如果要求输入用户名和密码：
  - **Username**: 你的 GitHub 用户名
  - **Password**: 使用 Personal Access Token（不是密码！）
    - 如何创建 Token：https://github.com/settings/tokens/new
    - 勾选 `repo` 权限
    - 生成后复制 token，当作密码输入

### 方法 B：使用 SSH（推荐给经常用 Git 的人）

如果你已经配置了 SSH key：

```bash
# 修改远程仓库 URL 为 SSH 格式
git remote set-url origin git@github.com:yepingguan-web/nce.git

# 推送
git push -u origin main
```

---

## ✅ 验证推送成功

1. 打开：https://github.com/yepingguan-web/nce
2. 应该能看到所有文件已经上传
3. README.md 会自动显示在仓库首页

---

## 🔄 后续更新代码

每次修改代码后：

```bash
# 查看修改
git status

# 添加修改的文件
git add .

# 提交
git commit -m "描述你的修改"

# 推送到 GitHub
git push
```

---

## ❓ 常见问题

### Q1: 推送失败，提示 "error: failed to push some refs"

**原因**：GitHub 仓库中有本地没有的文件（比如你创建了 README）

**解决方案**：
```bash
# 先拉取远程更新
git pull origin main --allow-unrelated-histories

# 如果有冲突，解决后再次推送
git push -u origin main
```

### Q2: 忘记创建 Personal Access Token

**解决方案**：
1. 访问：https://github.com/settings/tokens/new
2. Note: `Git operations`
3. Expiration: `90 days`
4. 勾选权限：`repo` (全部)
5. 点击 "Generate token"
6. **复制 token**（只显示一次！）
7. 再次推送时，用户名填你的 GitHub 用户名，密码填这个 token

### Q3: 想删除远程仓库重新创建

**解决方案**：
1. 访问：https://github.com/yepingguan-web/nce/settings
2. 滚动到底部
3. 点击 "Delete this repository"
4. 输入仓库名确认删除
5. 重新按照步骤 1 创建

---

## 🎯 下一步

推送成功后，你可以：

1. **启用 GitHub Pages**（免费静态托管）
   - Settings → Pages → Source: `main` → Save
   - 几分钟后访问：https://yepingguan-web.github.io/nce/

2. **添加更多课程数据**
   - 把 NCE 四册的音频和文本文件放到对应目录

3. **邀请合作者**
   - Settings → Collaborators → Add people

4. **配置 GitHub Actions**（自动构建 Docker 镜像）
   - 我可以帮你创建 `.github/workflows/docker.yml`

---

## 🆘 需要帮助？

如果遇到任何问题，告诉我：
- 错误信息是什么
- 运行了什么命令
- 期望的结果是什么

我会帮你解决！💪

---

**准备好了吗？** 按照上面的步骤操作，完成后告诉我结果！🚀
