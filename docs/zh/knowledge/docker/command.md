---
sidebar: [
{text: 'Docker', collapsible: true, children:[
{text: 'Basic', link: '/zh/knowledge/docker/docker'},
{text: 'CI/CD', link: '/zh/knowledge/docker/cicd'},
{text: 'Volume', link: '/zh/knowledge/docker/volume'},
{text: 'Network', link: '/zh/knowledge/docker/network'},
{text: '常用命令', link: '/zh/knowledge/docker/command'},
]},
{text: 'Docker compose', link: '/zh/knowledge/docker/docker-compose'},
{text: 'Docker swarm', link: '/zh/knowledge/docker/docker-swarm'},
{text: 'K8s', link: '/zh/knowledge/docker/k8s'},
]

prev: /zh/knowledge/docker/network
next: /zh/knowledge/docker/docker-compose

---

# 常用命令

目录
[[TOC]]

## 镜像相关

```shell:no-line-numbers
# 列出本地镜像
docker images [-a:包含中间层镜像;-q:只显示镜像ID;--no-trunc:显示详细信息]
# 删除镜像
docker rmi [-f:强制删除;--no-prune:不移除该镜像的过程镜像，默认移除]
# 使用Dockerfile构建镜像
docker build [-f:指定Dockerfile路径;--rm:设置镜像成功后删除中间容器;-t(--tag):设置镜像名称或者版本(name:v3);-q:构建完成后只输出镜像ID]
# 查看指定镜像的创建历史
docker history imageName
# 将指定镜像保存成 tar 归档文件
docker save [-o:输出到的文件]  # docker save -o my_ubuntu_v3.tar runoob/ubuntu:v3
# 导入使用 docker save 命令导出的镜像
docker load [-q:精简输出信息;-i:指定导入的文件,代替 STDIN]
# exp1:docker load < busybox.tar.gz; exp2:docker load --input fedora.tar
# 从镜像仓库中拉取或者更新指定镜像
docker pull imageName
# 将本地的镜像上传到镜像仓库,要先登陆到镜像仓库
docker push imageName
# 在仓库中寻找
docker search imageName
```

## 容器相关

```shell:no-line-numbers
# 创建一个新的容器并运行一个命令
docker run [-d:后台运行,返回容器ID;-it:进入终端;-h:指定容器的hostname;--name:容器名称;--link:添加链接到另一个容器] imageName:TAG
# 容器启停
docker start|stop|restart
# 删除容器
docker rm CONTAINER [CONTAINER...] [-f:强制]
# 创建一个容器,但不启动
docker create
# 列出容器
docker ps [-a:包含未启动的;-l:显示最近创建的容器;-n:列出最近创建的n个容器;-q:静默模式，只显示容器编号]
# 获取容器/镜像的元数据
docker inspect CONTAINER/IMAGE # 获取容器ip:docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' CONTAINER
# 查看容器中运行的进程信息
docker top CONTAINER
# 获取容器的日志
docker logs [-f:跟踪日志输出;-t:显示时间戳;--tail:仅列出最新N条容器日志;--since:显示某个开始时间的所有日志]
# 查看端口映射关系
docker port CONTAINER
```

## 网络相关

```shell:no-line-numbers
# 创建网络(默认桥接)
docker network create netName
# 将容器连接到网络。您可以按名称或ID连接容器
docker network connect [OPTIONS] netName containerName
# 断开容器与网络的连接。容器必须正在运行才能将其与网络断开连接
docker network disconnect [OPTIONS] netName containerName
# 返回有关一个或多个网络的信息。默认情况下，此命令将所有结果呈现在JSON对象中
docker network inspect [OPTIONS] netName [netName2...]
# 删除所有未使用的网络。未使用的网络是未被任何容器引用的网络。
docker network prune [OPTIONS]
# 列举网络
docker network ls [OPTIONS]
# 按名称或标识符删除一个或多个网络。要删除网络，必须首先断开连接到它的所有容器
docker network rm netName [netName2...]
```

## 卷相关

```shell:no-line-numbers
# 创建一个供容器使用和存储数据的新卷。如果未指定名称，则Docker会生成一个随机名称
docker volume create [OPTIONS] [VOLUME]
# 返回卷的相关信息
docker volume inspect [OPTIONS] VOLUME [VOLUME...]
# 删除所有未使用的本地卷。未使用的本地卷是未被任何容器引用的那些
docker volume prune [OPTIONS]
# 删除一个或多个卷。您不能删除容器正在使用的卷。
docker volume rm [OPTIONS] VOLUME [VOLUME...]
```

## 资源占用

```shell:no-line-numbers
# 显示实时的容器资源使用情况统计流
docker stats [OPTIONS] [CONTAINER...]
```

## docker-compose常用命令

```shell:no-line-numbers
# 构建启动容器(yml文件变更后也可以使用up -d 直接更新)
docker-compose up [-d:后台运行] [IMAGE]
# 删除所有容器,镜像 
docker-compose down
# 显示所有容器
docker-compose ps
# 校验docker-compose.yml文件格式
docker-compose config -q
# 构建镜像
docker-compose build
# 进入容器
docker-compose exec CONTAINER bash
# 删除容器
docker-compose rm CONTAINER
# 重启
docker-compose restart
```

## 清空container日志

```shell:no-line-numbers
echo "" > $(docker inspect --format='{{.LogPath}}' <containerID>)
```