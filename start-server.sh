#!/bin/bash

# NCE-Flow-Plus 本地测试服务器启动脚本

echo "🚀 启动 NCE-Flow-Plus 本地测试服务器..."
echo ""

# 检查 Python 是否安装
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误：未找到 Python，请先安装 Python"
    exit 1
fi

echo "✅ 使用 Python: $($PYTHON_CMD --version)"
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 启动 HTTP 服务器
echo "📡 启动 HTTP 服务器..."
echo "🌐 访问地址："
echo "   - 首页: http://localhost:8000"
echo "   - 课文页: http://localhost:8000/lesson.html"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 首次使用跟读功能需要允许浏览器访问麦克风"
echo "   - 跟读功能需要 Chrome 或 Edge 浏览器（支持 Web Speech API）"
echo ""
echo "🎤 测试跟读功能："
echo "   1. 打开 http://localhost:8000/lesson.html"
echo "   2. 点击任意句子的 '🎤 跟读' 按钮"
echo "   3. 允许麦克风权限"
echo "   4. 听到提示音后，跟读句子"
echo "   5. 查看评分结果"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动服务器
$PYTHON_CMD -m http.server 8000
