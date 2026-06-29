# Docker 部署指南

本文档介绍如何使用 Docker 快速部署 NCE-Flow-Plus。

## 🚀 方式一：一键运行（最简单）

### 前提条件
- 已安装 Docker

### 步骤

1. **直接运行**（无需克隆代码）

```bash
docker run -d \
  -p 8080:80 \
  --name nce-flow-plus \
  --restart unless-stopped \
  your-dockerhub-username/nce-flow-plus:latest
```

2. **访问应用**

打开浏览器，访问：http://localhost:8080

3. **自定义端口**

```bash
docker run -d \
  -p 3000:80 \
  --name nce-flow-plus \
  --restart unless-stopped \
  your-dockerhub-username/nce-flow-plus:latest
```

然后访问：http://localhost:3000

## 🐳 方式二：本地构建并运行

### 前提条件
- 已安装 Docker
- 已克隆本项目

### 步骤

1. **克隆项目**

```bash
git clone https://github.com/yepingguan-web/nce.git
cd nce
```

2. **构建 Docker 镜像**

```bash
docker build -t nce-flow-plus:latest .
```

3. **运行容器**

```bash
docker run -d \
  -p 8080:80 \
  --name nce-flow-plus \
  --restart unless-stopped \
  nce-flow-plus:latest
```

4. **访问应用**

打开浏览器，访问：http://localhost:8080

## 🎛️ 方式三：使用 Docker Compose

### 前提条件
- ✅ 已安装 Docker 和 Docker Compose

### 步骤

1. **克隆项目**

```bash
git clone https://github.com/yepingguan-web/nce.git
cd nce
```

2. **启动服务**

```bash
docker-compose up -d
```

3. **查看日志**

```bash
docker-compose logs -f
```

4. **停止服务**

```bash
docker-compose down
```

5. **访问应用**

打开浏览器，访问：http://localhost:8080

## 🔧 常用 Docker 命令

### 查看运行中的容器

```bash
docker ps
```

### 查看容器日志

```bash
docker logs nce-flow-plus
```

### 停止容器

```bash
docker stop nce-flow-plus
```

### 启动容器

```bash
docker start nce-flow-plus
```

### 重启容器

```bash
docker restart nce-flow-plus
```

### 删除容器

```bash
docker rm -f nce-flow-plus
```

### 进入容器调试

```bash
docker exec -it nce-flow-plus /bin/sh
```

## 🌐 部署到生产环境

### 1. 构建镜像并推送到 Docker Hub

```bash
# 登录 Docker Hub
docker login

# 构建镜像
docker build -t your-username/nce-flow-plus:latest .

# 推送镜像
docker push your-username/nce-flow-plus:latest
```

### 2. 在生产服务器上运行

```bash
docker run -d \
  -p 80:80 \
  --name nce-flow-plus \
  --restart unless-stopped \
  your-username/nce-flow-plus:latest
```

### 3. 使用 Nginx 反向代理（可选）

如果你想使用域名访问，可以配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 💡 注意事项

1. **音频文件大小**
   - 如果音频文件很大，建议挂载到容器外部：
   ```bash
   docker run -d \
     -p 8080:80 \
     -v $(pwd)/NCE1:/usr/share/nginx/html/NCE1:ro \
     -v $(pwd)/NCE2:/usr/share/nginx/html/NCE2:ro \
     --name nce-flow-plus \
     nce-flow-plus:latest
   ```

2. **权限问题**
   - 如果遇到权限问题，在运行容器时添加 `--user $(id -u):$(id -g)`

3. **更新应用**
   - 拉取最新代码后，重新构建镜像：
   ```bash
   git pull
   docker build -t nce-flow-plus:latest .
   docker stop nce-flow-plus
   docker rm nce-flow-plus
   docker run -d -p 8080:80 --name nce-flow-plus nce-flow-plus:latest
   ```

## 🆘 故障排查

### 问题 1：端口被占用

**解决方案**：更换端口
```bash
docker run -d -p 8081:80 --name nce-flow-plus nce-flow-plus:latest
```

### 问题 2：容器无法启动

**解决方案**：查看日志
```bash
docker logs nce-flow-plus
```

### 问题 3：无法访问应用

**解决方案**：
1. 检查容器是否运行：`docker ps`
2. 检查端口映射：`docker port nce-flow-plus`
3. 检查防火墙设置

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 官方文档](https://nginx.org/en/docs/)

---

Made with ❤️ for English learners
