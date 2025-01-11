---
sidebar: [
{text: '🐳 Docker', collapsible: true, children:[
{text: 'Basic', link: 'knowledge/docker/docker'},
{text: 'CI/CD', link: 'knowledge/docker/cicd'},
{text: 'Volume', link: 'knowledge/docker/volume'},
{text: 'Network', link: 'knowledge/docker/network'},
{text: 'Commands', link: 'knowledge/docker/command'},
]},
{text: '🎛 Docker compose', link: 'knowledge/docker/docker-compose'},
{text: '🕸 Docker swarm', link: 'knowledge/docker/docker-swarm'},
{text: '🐙 K8s', link: 'knowledge/docker/k8s'},
]

prev: /us/knowledge/docker/command
next: /us/knowledge/docker/docker-swarm

---

# Docker compose

Index
[[TOC]]

::: tip 【Concept】
- When multiple containers need to communicate or depend on each other, we can arrange them together according to certain rules. This is done by declaring them in a `docker-compose.yml` file.
- The `docker-compose.yml` is based on version 3. For details on each option, refer to the: [v3 configuration reference](https://docs.docker.com/compose/compose-file/compose-file-v3/)
- Even for a single container, I prefer to write a `docker-compose.yml` file, as it provides a clearer view of what configurations are made within that container.
:::

---

## Container Shared Network

- If containers need to communicate with each other, they must be on the same network configuration (special handling is required in Docker Swarm mode).
- Multiple containers on the same network do not need to be orchestrated within a single docker-compose.yml.
- Communication between containers can be done via IP:port. Alternatively, containers can communicate using ContainerName:port, but the network orchestration and configuration must be handled carefully to account for differences.

---

> Here is an example using Redis master-slave (multiple Redis instances need to communicate to back up data):

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
Looking at the yml file alone doesn't reveal the communication setup; you need to check the corresponding configuration：
- [master-redis-config](https://github.com/JerryTZF/docker-redis/blob/main/redis-master/conf/redis.conf)
- [slave1-redis-config](https://github.com/JerryTZF/docker-redis/blob/main/redis-slave/conf2/redis.conf)
- [slave2-redis-config](https://github.com/JerryTZF/docker-redis/blob/main/redis-slave/conf3/redis.conf)

---

Here, pay attention to the slaveof field in the Redis configuration for the slave. You can think about why the port is 6379 instead of 6371 :sunglasses:
:::

## Multiple Containers Sharing Files and Directories

- When multiple containers need to share data, it is necessary to mount it to a shared volume, and then specify the volume mapping when orchestrating or starting the containers.
- If the data in the shared volume is highly sensitive and important, it is best to perform regular backups.
- If multiple containers need to share data, it is recommended to create a shared volume in advance and then specify the usage of the existing shared volume.

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