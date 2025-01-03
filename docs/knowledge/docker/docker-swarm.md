---
sidebar: [
{text: '🐳 Docker', collapsible: true, children:[
{text: 'Basic', link: 'knowledge/docker/docker'},
{text: 'CI/CD', link: 'knowledge/docker/cicd'},
{text: 'Volume', link: 'knowledge/docker/volume'},
{text: 'Network', link: 'knowledge/docker/network'},
{text: '常用命令', link: 'knowledge/docker/command'},
]},
{text: '🎛 Docker compose', link: 'knowledge/docker/docker-compose'},
{text: '🕸 Docker swarm', link: 'knowledge/docker/docker-swarm'},
{text: '🐙 K8s', link: 'knowledge/docker/k8s'},
]

prev: /knowledge/docker/docker-compose
next: /knowledge/docker/k8s

---

# docker集群

目录
[[TOC]]

## 1、docker swarm 是什么

`Docker` 原生支持的容器集群管理工具，它可以把多个 `Docker` 主机组成的系统转换为单一的虚拟 `Docker` 主机，使得容器可以组
成***跨主机***的子网网络。通过执行命令与单一的主 `Swarm` 进行沟通，而不必分别和每个 `Docker Engine` 沟通。在灵活的调度策略下，
团队可以更好地管理可用的主机资源，保证应用容器的高效运行。

## 2、docker swarm 优势

- 动态扩容，可以动态的将各个服务运行至对应的机器。 (`replicated` 、 `global`)
- 集群服务支持动态路由，由 `ingress routing mesh` 支持。
- 支持动态扩容缩容，以及节点不可用时的动态发现和舍弃。

## 3、集群构建

::: tip
这里以一台阿里云(Manager)、两台腾讯云(Worker)为例，
Ps:正常来说，集群搭建应该是一个机房或者一个局域网内机器搭建，这里以两台公网机器搭建，顺便还要搭建自己的内网，这里我使用的是 [zerotier](https://my.zerotier.com/network/e5cd7a9e1c096a33)，
组[内网文章教程](https://zhuanlan.zhihu.com/p/383471270)
:sunglasses:

这里的`ECS`的安全组需要打开一些端口。

![](https://img.tzf-foryou.xyz/img/20220405225239.png)

![](https://img.tzf-foryou.xyz/img/20220405225409.png)

端口解释：\
`4789`：端口4789用于容器入网的UDP。`Docker Swarm` 默认的是4789，但是这里为什么是5789呢？因为阿里云默认不开放 `4789 UDP` 端口。:cry:\
`7946`：端口7946 TCP/UDP用于容器网络发现。\
上面两个端口可参见：[Use swarm mode routing mesh](https://docs.docker.com/engine/swarm/ingress/)\
`2377`：指定将向 `swarm` 的其他成员通告用于 `API` 访问和覆盖网络的地址的默认端口。
详见：[docker swarm init](https://docs.docker.com/engine/reference/commandline/swarm_init/) 搜索 `2377` 即可见。
:::

### 3-1、初始化Manager

```shell:no-line-numbers
docker swarm init --advertise-addr 10.147.18.171:2377 --data-path-addr 10.147.18.171 --data-path-port 5789
```

::: warning 10.147.18.171 为你在 zerotier 中设置的对应IP。
:::

---

### 3-2、加入Worker

```shell:no-line-numbers
docker swarm join --token SWMTKN-1-4a4oznjmnvmkzn801ktr77enqcfvef66oxxxxxxxxxxxx-1d8eqa89161a1rcz3ozfqt4iz 10.147.18.171:2377
```

---

> 在Manager上可以查看节点信息，加入节点前，建议先修改下 `Hostname` 容易区分。

![](https://img.tzf-foryou.xyz/img/20220406102016.png)

---

### 3-3、创建overlay网络

```shell
docker network create -d overlay --attachable proxy
```

### 3-4、编写stack文件

::: warning

stack文件的几个关键点注意下：
- `image` 不可以是动态build，只能是已经构建完成的镜像。
- `docker stack`不支持基于第2版写的 `docker-compose.yml` ，也就是 `version` 版本至少为3。然而`Docker Compose`对版本为2和3的 文件仍然可以处理。
- 集群中的数据共享，这里的卷可以采用 `挂载远程卷(NFS)`
  :::

集群一些关键字段请参考：[deploy](https://docs.docker.com/compose/compose-file/deploy/)\
这里有几个示例可以参考下我的stack文件。【注意】traefik的配置选项 ~~后面~~ :sunglasses:  单独记[笔记](harvest/traefik/overview.md)再介绍。
- [bitwarden-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/bitwarden-stack.yml)
- [nginx-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/nginx-stack.yml)
- [portainer-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/portainer-stack.yml)
- [traefik-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/traefik-stack.yml)

---

数据卷绑定目录示例：

```yaml:no-line-numbers
services:
  backend:
    image: awesome/backend
    volumes:
      - type: volume
        source: db-data
        target: /data
        volume:
          nocopy: true
      - type: bind
        source: /var/run/postgres/postgres.sock
        target: /var/run/postgres/postgres.sock

volumes:
  db-data:
```

---

绑定文件示例：

```yaml:no-line-numbers
version: '3.7'
services:
  hyperf:
    image: $REGISTRY_URL/$PROJECT_NAME:test
    environment:
      - "APP_PROJECT=hyperf"
      - "APP_ENV=test"
    ports:
      - 9501:9501
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 5
      update_config:
        parallelism: 2
        delay: 5s
        order: start-first
    networks:
      - hyperf_net
    configs:
      - source: hyperf_v1.0
        target: /opt/www/.env
configs:
  hyperf_v1.0:
    external: true
networks:
  hyperf_net:
    external: true

```

---

### 3-5、启动和管理

```shell:no-line-numbers
sudo docker stack deploy --with-registry-auth -c vuepress-stack.yml vuepress
```

## 4、swarm网络

### 4-1、服务发现

Docker Swarm Mode 下会为每个节点的 docker engine内置一个DNS server，
各个节点间的DNS server通过control plane的gossip协议互相交互信息。注：此处DNS server用于容器间的服务发现。

swarm mode会为每个--net=自定义网络的service分配一个DNS entry。注：目前必须是自定义网络，比如overaly。
而bridge和routing mesh的service，是不会分配DNS的。

### 4-2、LB(load balance)

::: tip
docker swarm mode有两种LB模式：1. Internal Load Balancing 2. Ingress Load Balancing。\
这里注重说 `Ingress`
:::

---

Ingress LB可以将容器网络中的服务暴露到宿主机网络中，从而被外部所访问。

Swarm mode下，docker会创建一个默认的overlay网络—ingress network。
Docker也会为每个worker节点创建一个特殊的net namespace（sandbox）-- ingress_sbox。
ingress_sbox有两个endpoint，一个用于连接ingress network，另一个用于连接local bridge network -- docker_gwbridge。
Ingress network的IP空间为10.255.0.0/16，所有router mesh的service都共用此空间。