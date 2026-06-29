# NCE-Flow-Plus Docker 部署配置

# 使用官方的 Nginx 镜像
FROM nginx:alpine

# 维护者信息
LABEL maintainer="yepingguan-web"

# 删除 Nginx 默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制项目文件到 Nginx 根目录
COPY . /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
