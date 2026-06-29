# NCE-Flow-Plus 🎤

新概念英语在线点读 **增强版** - 支持句子跟读与发音评分

[在线体验](#) | [原项目](https://github.com/luzhenhua/NCE-Flow)

## ✨ 核心功能

### 基础功能（来自 NCE-Flow）
- ✅ 句子级点读：点击任意句子开始播放，自动高亮跟随
- ✅ 多语言视图：EN / EN+CN / CN 三种显示模式
- ✅ 播放控制：倍速调节、连读/点读切换、循环模式、断点续播
- ✅ 全局快捷键：空格播放/暂停、方向键导航、音量控制
- ✅ 学习管理：课程收藏、学习记录、进度追踪
- ✅ 现代界面：Apple 风格、深浅色主题、响应式设计
- ✅ 零依赖：纯静态文件，解压即用

### 🆕 增强功能
- 🎤 **句子跟读**：点击跟读按钮，录制自己的发音
- 📊 **发音评分**：实时评分，给出改进建议
- 📈 **学习报告**：追踪学习进度和发音改进
- 🔄 **对比播放**：原音 vs 跟读，方便对比

## 🚀 快速开始

### 方式一：Docker 一键部署

```bash
docker run -d -p 8080:80 --name nce-flow-plus --restart unless-stopped your-docker-image:latest
```

然后访问 http://localhost:8080

### 方式二：本地开发服务器

```bash
# 克隆项目
git clone https://github.com/yepingguan-web/nce.git
cd nce

# 启动本地服务器（Python）
python -m http.server 8000

# 访问 http://localhost:8000
```

## 🎤 跟读与评分功能说明

### 使用方法
1. 点击句子旁边的 **"跟读"** 按钮
2. 允许浏览器访问麦克风
3. 听到提示音后，开始跟读句子
4. 系统自动录制并评分
5. 查看评分结果和改进建议

### 评分标准
- **发音准确度**：语音识别匹配度 (0-100分)
- **流利度**：语速和停顿的自然度
- **完整度**：是否完整读出所有单词

### 技术支持
- 使用 Web Speech API 进行语音识别
- 使用 MediaRecorder API 进行音频录制
- 评分算法基于语音识别置信度和文本相似度

## 📁 项目结构

```
nce/
├── assets/              # 样式与脚本
│   ├── style.css       # 主样式
│   ├── app.js          # 主逻辑
│   ├── recorder.js     # 录音功能
│   └── scorer.js      # 评分功能
├── static/             # 课程数据
├── NCE1~NCE4/         # 四册音频和字幕
├── index.html          # 首页
├── lesson.html         # 课文页（含跟读功能）
└── README.md           # 说明文档
```

## 🛠️ 技术栈

- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **音频处理**：Web Audio API + MediaRecorder API
- **语音识别**：Web Speech API
- **评分算法**：自定义相似度算法 + 语音识别置信度
- **部署**：Docker + Nginx

## 📊 版本历史

- **v0.1.0** (2026-06-29): 初始版本，基础点读 + 跟读评分功能

## ⚠️ 免责声明

本项目仅限个人学习使用，请支持正版新概念英语教材。

## 📄 许可证

MIT License

## 🙏 致谢

- [NCE-Flow](https://github.com/luzhenhua/NCE-Flow) - 原项目灵感来源
- [新概念英语】- 经典英语学习教材

---

Made with ❤️ for English learners
