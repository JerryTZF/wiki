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

prev: /us/knowledge/docker/cicd
next: /us/knowledge/docker/network

---

# 卷的使用

目录
[[toc]]

::: tip 【说明】
我自己的使用场景更多聚焦于 `容器编排(docker compose)` 和 `集群模式(docker swarm)` 下的使用，
所以示例会偏向于上面两种模式 ，对于单个容器的创建过程中卷的声明
，你可以参考 [volume](https://docs.docker.com/storage/volumes/)。
:::

---

## 容器数据管理

- **Volume**： 卷存储在由 `Docker` 管理的主机文件系统的一部分（Linux 上的 `/var/lib/docker/volumes/`）。 非 `Docker` 进程不应修改文件系统的这一部分。卷是在 `Docker` 中持久化数据的最佳方式。
- **Bind Mounts**：绑定挂载可以存储在主机系统的任何位置。它们甚至可能是重要的系统文件或目录。`Docker` 主机或 `Docker` 容器上的非 `Docker` 进程可以随时修改它们。
- **Tmpfs**：`tmpfs` 挂载仅存储在主机系统的内存中，永远不会写入主机系统的文件系统。

***下面主要说明 `Volume` 和 `Bind Mounts` 这两种数据持久化方式。***

---

## Bind Mounts

**适用场景或原则上你应该这么使用：**

1. 从主机共享配置文件到容器。
2. 在 `Docker` 主机上的开发环境和容器之间共享源代码或构建工件。即：`Docker` 容器只是提供对应的开发环境，源代码全部映射入容器中进行调试。例如：
3. 当 `Docker` 主机的文件或目录结构保证与容器所需的绑定挂载一致时

***示例：***

```yaml:no-line-numbers
version: "3.5"

services:
  web:
    image: nginx:alpine
    container_name: nginx
    restart: always
    ports:
      - "8082:80"
      - "4434:443"
    volumes:
      # 全部为挂载模式
      - $PWD/nginx_log:/var/log/nginx
      - $PWD/html:/usr/share/nginx/html
      - /etc/nginx/nginx.conf:/etc/nginx/nginx.conf
```

---

::: danger 【注意】
如果将绑定挂载或非空卷挂载到容器中存在某些文件或目录的目录中，则这些文件或目录会被挂载遮盖，
就像将文件保存到 `Linux` 主机上的 `/mnt` 中，然后将 `USB` 驱动器安装到 `/mnt`。
`/mnt` 的内容将被 `USB` 驱动器的内容所掩盖，直到卸载 `USB` 驱动器。隐藏的文件不会被删除或更改，但在挂载绑定挂载或卷时无法访问。
:::

---

## Volume

**适用场景或原则上你应该这么使用：**

1. 在多个正在运行的容器之间共享数据。如果你没有显式创建它，则会在第一次将其挂载到容器中时创建一个卷。当该容器停止或移除时，该卷仍然存在。多个容器可以同时挂载同一个卷，无论是读写还是只读。仅当你明确删除它们时才会删除卷。示例：
```yaml:no-line-numbers
version: "3.9"

services:
  db:
    image: db
    volumes:
      - data-volume:/var/lib/db
  backup:
    image: backup-service
    volumes:
      - data-volume:/var/lib/backup/data

volumes:
  data-volume:
```
2. 当 `Docker` 主机不能保证具有给定的目录或文件结构时。卷可帮助你将 `Docker` 主机的配置与容器运行时分离。
3. ~~当你想将容器的数据存储在远程主机或云提供商上而不是本地时~~ 暂时没用过 :cry: 。
4. 当你需要从一台 `Docker` 主机 ***备份*** 、***恢复*** 或 ***迁移*** 数据到另一台主机时，卷是更好的选择。你可以停止使用该卷的容器，然后备份该卷的目录。
5. 当你的应用程序需要 `Docker` 上的高性能 I/O 时。卷存储在 `Linux VM` 中而不是主机中，这意味着读取和写入具有更低的延迟和更高的吞吐量。
6. 当你的应用程序需要 `Docker` 上的完全本机文件系统行为时。例如，数据库引擎需要精确控制磁盘刷新以保证事务的持久性。卷存储在 `Linux` 虚拟机中并可以做出这些保证，而绑定挂载远程到 `macOS` 或 `Windows`，其中文件系统的行为略有不同。

---

***示例：***

```yaml:no-line-numbers
version: "3.5"

services:
  web:
    image: nginx:alpine
    container_name: nginx
    restart: always
    ports:
      - "8081:80"
      - "4433:443"
    volumes:
      # 卷模式:当启动时,docker会自动创建名为"nginx_log"的卷且由docker自己管理
      # Linux下,目录为:/var/lib/docker/volumes
      - type: volume
        source: nginx_log
        target: /var/log/nginx
      # 挂载模式:当使用绑定挂载时,主机上的文件或目录会挂载到容器中
      # 外部目录需要自己管理
      - type: bind
        source: nginx.conf
        target: /etc/nginx/nginx.conf
      - type: bind
        source: $PWD/html
        target: /usr/share/nginx/html
volumes:
  nginx_log:
```

---

::: warning volume 和 bind mount 区别
- bind mount 需要你自己声明好宿主机对应的目录 `挂载` 至 容器内的指定目录，而 volume 是docker自己进行管理，只需要你声明对应的卷即可。
- 不同的系统(`Mac`、`Windows`、`Linux`)对应的文件系统的目录不一致，bind mount需要自己管理，并且对应的权限也是只有root才可以，volume 则不需要。
- 当需要共享目录时，请使用 `volume` ，尽量不要用 `volume_from` 关键字了。
:::
---

## 集群模式

::: warning 【注意】
集群模式(Docker Swarm)下，挂载单个文件(配置文件)，数据持久化会和单机模式不太一样，下面进行说明。
:::

### 1、配置文件

::: tip 多个节点的容器共同使用对应的配置
:::

***示例：***

```yaml:no-line-numbers
version: "3.5"

services:
  nginx-test:
    image: nginx
    networks:
      - proxy
    deploy:
      mode: global
      placement:
        constraints:
          - "node.role==worker"
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.nginx.rule=Host(`nginx.demo.com`)"
        - "traefik.http.routers.nginx.entrypoints=websecure"
        - "traefik.http.routers.nginx.tls.certresolver=le"
        - "traefik.http.services.nginx.loadbalancer.server.port=80"
    configs:
      - source: index
        target: /usr/share/nginx/html/index.html


networks:
  proxy:
    external: true

configs:
  index:
    file: /nfsroot/nginx/index.html
```
---

::: warning 【注意】
- 非 `Manager` 不能创建和管理 `Configs`。
- 要先移除对应的 `Service` 后，才能删除对应的配置。
- 当需要更新配置时，详见：[官方文档](https://docs.docker.com/engine/swarm/configs/#example-rotate-a-config)、[CSDN](https://blog.csdn.net/u013761036/article/details/103650652)
  :::

---

### 2、卷的使用

::: warning 【说明】
暂时我是让对应的节点创建它们各自的卷，日志等需要查看的内容分散在不同节点。
你可以使用 [volume NFS 共享存储模式](https://qastack.cn/programming/47756029/how-does-docker-swarm-implement-volume-sharing)。当然集群日志收集使用 `ELK` 等专业方案更加优雅。
:::

***示例：***

```yaml:no-line-numbers
version: "3.5"

services:
  hyperf-cluster-server:
    image: demo:v3.8.0
    networks:
      - proxy
    volumes:
      - type: volume
        source: server_logs
        target: /opt/www/runtime/logs
      - type: volume
        source: server_cert
        target: /opt/www/app/Cert
    deploy:
      mode: global
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.hyperf-cluster-server.rule=Host(`hyperf.demo.com`)"
        - "traefik.http.routers.hyperf-cluster-server.entrypoints=websecure"
        - "traefik.http.routers.hyperf-cluster-server.tls.certresolver=le"
        - "traefik.http.services.hyperf-cluster-server.loadbalancer.server.port=9501"

networks:
  proxy:
    external: true

volumes:
  server_logs:
  server_cert:
```

---

::: tip 持续施工
:construction:
:::
