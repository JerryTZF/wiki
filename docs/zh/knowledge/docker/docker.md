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

prev: /zh/knowledge/container
next: /zh/knowledge/docker/cicd

---

# Docker

目录
[[toc]]


::: warning 我最开始使用 Docker 的原因
在使用 `Docker` 前，我们应该知道我们的诉求和痛点是什么，然后去了解 `Docker` 是否可以解决我们的痛点；

---

以我为例：

- `Swoole` 无法跑在 `Windows` 上( 现在可以了:smile: )，但是Docker虚拟化出对应的环境可以解决。
- 多个项目依赖的 `PHP` 版本不一致，并且需要在 `Nginx` 上配置多个虚拟主机。
- 代码维护起来非常麻烦，多个环境，多个版本，有时要具体看代码才能区分出来，而且有时还要关注下代码细节。:cry:
- 对于不熟悉我的项目的同事要跑起来项目，需要配置很多配置，有时他们只是想看下效果，我需要花费一些时间进行沟通。

:::

---

## 一、docker是什么

docker是一种**虚拟化环境技术**，例如`vmware`，`virtualbox`等，本质上是环境隔离的作用。将项目与项目之间做到相对的独立、层次更加分明。

## 二、docker的优势

- 交付方便快捷
- 将项目和环境一起打包运行，具有很好的隔离性
- 降低维护成本

## 三、使用原则

- 一个容器原则上推荐只部署一个应用，应用之间需要通信的要通过容器间通信的方式通信。
- 构建自定义镜像时，建议使用最精简的基础镜像(减少镜像大小)。
- 当有多个容器(服务)可以归类时，建议使用自定义网络，将这些容器放入自定义网络，而其他的不允许访问自定义网络。
- 当多个容器需要共享数据时，建议使用公共卷而不是公共容器。

## 四、安装

- [ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [centos](https://docs.docker.com/engine/install/centos/)
- [windows desktop](https://docs.docker.com/desktop/windows/install/)
- [mac desktop](https://docs.docker.com/desktop/mac/install/)
- [docker compose](https://docs.docker.com/compose/install/)

---

::: tip 更换镜像源源
- 获取加速地址：前往 => https://cr.console.aliyun.com/cn-shenzhen/instances/mirrors => 镜像加速器
- 编辑配置：编辑(不存在则新建) /etc/docker/daemon.json ，添加：`{"registry-mirrors": ["https://xxxxxxx.mirror.aliyuncs.com"]}`
- 重启：`systemctl daemon-reload` + `systemctl restart docker`
:::

---

## 五、核心要素

### 5-1、镜像

- 基于宿主机内核的、可叠加的、用来打包软件运行环境和基于运行环境开发的文件系统。
- **静态只读分层结构**；静态：就像代码不运行起来永远只是没有执行的字母文字一样；只读：当一个镜像构建时，相当于在构建文件系统，在未被运行时，文件内容是不会被写入的；分层结构：任何一个镜像都是基于一个基础镜像，即在基础镜像之上被重新构建。
- 我们的项目或者环境都是基于一个基础镜像，然后来编写环境、项目代码等内容。

---

::: tip
- 对于自定义镜像，我们需要定义 `Dockerfile` 来在基础镜像的基础上，丰富我们自己的需要的功能。eg: [自定义构建LNMP环境](https://github.com/JerryTZF/fpm-nginx-image/blob/main/lnmp-image/php8.0-fpm/Dockerfile)
- 一些官方镜像，镜像内部开放了很多对应的启动工具或者其他工具，在使用官方镜像时，请尽量去 `dockerhub` 阅读文档。
:::

---

### 5-2、容器

- 容器是运行时(Runtime)的，它包含了项目的所有运行环境(系统、代码、依赖包、语言环境等)。
- 容器与容器之间相互隔离的(沙箱机制)，相互不会影响。
- 所有对容器的改动 - 无论添加、删除、还是修改文件都只会发生在容器层中。只有容器层是可写的，容器层下面的所有镜像。层都是只读的，也就是说容器修改内容是不会影响依赖于该镜像的其他容器。

---

![容器镜像结构](https://img.tzf-foryou.xyz/img/20231228224707.png)

::: warning 【说明】
简单理解，镜像和容器可以理解为类(Class)和对象(Object)的关系，实例化类之前，类只是声明了环境、依赖等关系，只有当实例化对象后，才可以对对象进行操作，但是类本身是没有变化的，再次实例化一个新的对象是不会看到之前对象修改的变化。
:::

### 5-3、网络

> docker的网络基本分为四种模式：

- **Host**：主机模式；启动容器的时候使用host模式，那么这个容器将不会获得一个独立的 `Network Namespace`，
  而是和宿主机共用一个 `Network Namespace` 。容器将不会虚拟出自己的网卡，配置自己的IP等，而是使用宿主机的IP和端口。

- **Container**：容器模式；这个模式指定新创建的容器和已经存在的一个容器共享一个 `Network Namespace`，
  而不是和宿主机共享。新创建的容器不会创建自己的网卡，配置自己的IP，而是和一个指定的容器共享IP、端口范围等。

- **None**: 没有网络模式；这种模式下，Docker容器拥有自己的 `Network Namespace`，但是，并不为 `Docker` 容器进行任何网络配置。
  也就是说，这个 `Docker` 容器没有网卡、IP、路由等信息。需要我们自己为 `Docker` 容器添加网卡、配置IP等。

- **Bridge**: 网桥模式；bridge模式是 `Docker` 默认的网络设置，此模式会为每一个容器分配 `Network Namespace`、设置IP等，
  并将一个主机上的 `Docker` 容器连接到一个虚拟网桥上。

- **overlay2**：`overlay` 网络用于连接不同机器上的 `Docker` 容器，允许不同机器上的容器相互通信，同时支持对消息进行加密。

---

![桥接模式](https://img.tzf-foryou.xyz/img/20220331194017.png)

---

::: warning 【注意】
- 多个容器间通信请务必保证在同一网络下。
- 不同功能的服务(servers)集，尽量保证在不同的网络下，举例：前端的server1、server2…等在一个网络下，后端server1、server2…等在另一个网络下。
- 同一网络下的不同服务没有必要编排在一个 `docker-compose.yml` 内。
:::

### 5-4、数据卷

**作用**：

- 数据持久化：当容器删除时，容器产生的数据依旧可以在磁盘保存。
- 数据共享：容器间数据可以共享。
- 动态修改：一些配置文件会映射出来

---

**数据卷的三种映射方式**：

![docker文件系统](https://img.tzf-foryou.xyz/img/20220410204852.png)

1. bind mount

> 绑定容器指定目录至宿主机指定目录。

```yaml:no-line-numbers
version: "3.5"
services:
  rabbitmq:
    image: rabbitmq:3.8.3-management
    container_name: rabbitmq
    volumes:
      - $PWD/data:/var/lib/rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: root
      RABBITMQ_DEFAULT_PASS: root
      TZ: Asia/Shanghai
    ports:
      - "5672:5672"
      - "15672:15672"
```

---

::: tip
可以通过以下方式查看数据卷映射的类型.
```shell:no-line-numbers
# docker inspect dddfd27a73a5
"Mounts": [
         {
             "Type": "bind",
             "Source": "/home/www/docker-servers/rabbitmq/data",
             "Destination": "/var/lib/rabbitmq",
             "Mode": "rw",
             "RW": true,
             "Propagation": "rprivate"
         }
     ],
```
:::

---

2. volume

> 绑定容器指定目录至docker管理的卷路径。

```yaml:no-line-numbers
version: "3.9"
services:
  frontend:
    image: node:lts
    volumes:
      - myapp:/home/node/app
  backend:
  	image: sss
  	volumes:
  	  - myapp:/home/node/app
volumes:
  myapp:
``` 

---

```yaml:no-line-numbers
version: "3.9"
services:
  frontend:
    image: node:lts
    volumes:
      - myapp:/home/node/app
volumes:
  myapp:
    external: true
```
---

::: tip
docker管理的卷在下面目录中
```shell:no-line-numbers
ls /var/lib/docker/volumes/
```
:::

---

3. tmpfs mount

存入内存，基本不用，不做过多介绍。 :stuck_out_tongue:

::: danger 【注意】
集群模式(Docker Swarm)下的会有 `远程卷` 、`共享卷` 等操作，这个在 `卷的使用` 篇详细介绍。
:::

---

