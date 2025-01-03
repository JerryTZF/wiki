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

prev: /knowledge/docker/command
next: /knowledge/docker/docker-swarm

---

# 容器编排

目录
[[TOC]]

::: tip 【概念】
- 多个容器需要相互通信或者相互依赖的时候，我们可以将多个容器按照一定规则编排在一起。通过 `docker-compose.yml` 声明。
- `docker-compose.yml` 基于V3版本，具体每一个选项可以参考：[v3配置参考](https://docs.docker.com/compose/compose-file/compose-file-v3/)
- 单个容器我也更加倾向于编写 `docker-compose.yml` 文件，因为根据声明文件可以更加清晰的看出这个容器内都做了什么配置。
:::

---

## 容器共享网络

- 容器间需要进行通信，则需要多个容器处于同一网络配置下即可(docker swarm模式需要特殊处理)
- 多个容器处于同一网络下，则无需编排在一个`docker-compose.yml`内
- 容器间通信的可以通过`IP:port`通信。也可以通过`ContainerName:port`通信，但是对应的网络编排和配置要注意异同

---

> 这里以redis主从为例(多Redis实例间需要通信备份数据)

---

**master**

```yaml:no-line-numbers
version: "3.5"

services:
  redis-master:
    image: redis:latest
    container_name: redis-master
    restart: always
    ports:
      - "6371:6379"
    networks:
      - proxy
    privileged: true # 拥有root权限,可以挂在在其他设备上
    volumes:
      - $PWD/conf/redis.conf:/usr/local/etc/redis/redis.conf:rw
      - $PWD/data:/data:rw
    command: redis-server /usr/local/etc/redis/redis.conf

# 加入已有网络
networks:
  proxy:
    external: true
```

---

**slave**

```yaml:no-line-numbers
version: "3.5"

services:
  redis-2:
    image: redis:latest
    container_name: redis-2
    restart: always
    ports:
      - "6372:6379"
    networks:
      - proxy
    volumes:
      - $PWD/conf2/redis.conf:/usr/local/etc/redis/redis.conf:rw
      - $PWD/data2:/data:rw
    command: redis-server /usr/local/etc/redis/redis.conf

  redis-3:
    image: redis:latest
    container_name: redis-3
    restart: always
    ports:
      - "6373:6379"
    networks:
      - proxy
    volumes:
      - $PWD/conf3/redis.conf:/usr/local/etc/redis/redis.conf:rw
      - $PWD/data3:/data:rw
    command: redis-server /usr/local/etc/redis/redis.conf

# 加入已有网络
networks:
  proxy:
    external: true
```

---

::: warning
看`yml`文件是看不出通信的，需要看下对应的配置 :
- [master-redis-config](https://github.com/JerryTZF/docker-redis/blob/main/redis-master/conf/redis.conf)
- [slave1-redis-config](https://github.com/JerryTZF/docker-redis/blob/main/redis-slave/conf2/redis.conf)
- [slave2-redis-config](https://github.com/JerryTZF/docker-redis/blob/main/redis-slave/conf3/redis.conf)

---

这里注意下从Redis的配置中的 `slaveof` 字段，可以想想为啥端口是 `6379` 而不是 `6371`  :sunglasses:
:::

## 多容器共享文件、目录

- 多容器需要共享数据时，需要挂在到一个公共卷，然后容器编排或者启动容器时指定下卷的映射即可
- 当公共卷的数据非常敏感且重要时，最好做好备份工作
- 如需多容器共享数据，最好提前创建一个共享卷，然后指定使用已经存在的共享卷

---

```yaml:no-line-numbers
version: "3.5"
services:
  web:
    image: alpine
    volumes:
      - mydata:/data
  web1:
    image: alpine
    volumes:
      - mydata:/data
volumes:
  mydata:
  dbdata:
```

---

```yaml:no-line-numbers
version: "3.5"
  services:
    web:
      image: alpine
      volumes:
        - mydata:/data
    web1:
      image: alpine
      volumes:
        - mydata:/data
volumes:
  mydata:
    external: true
```