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

# Volume

Index
[[toc]]

::: tip 【Note】
My usage scenario focuses more on the use of container orchestration (docker compose) and cluster mode (docker swarm). 
Therefore, the examples will lean towards these two modes. 
For the declaration of volumes during the creation of a single container, you can refer to [volume](https://docs.docker.com/storage/volumes/)
:::

---

## Container Data Management

- **Volume**： Volumes are stored as part of the host filesystem managed by Docker (on Linux, this is typically located at /var/lib/docker/volumes/). Non-Docker processes should not modify this part of the filesystem. Volumes are the best way to persist data in Docker.
- **Bind Mounts**：Bind mounts can be stored anywhere on the host system. They may even be important system files or directories. Non-Docker processes on the Docker host or in the Docker container can modify them at any time.
- **Tmpfs**：tmpfs mounts are stored only in the host system's memory and are never written to the host filesystem.

***The following primarily discusses the two data persistence methods: `Volume` and `Bind Mounts`.***

---

## Bind Mounts

**Applicable Scenarios or Principles for Usage:**

1. Sharing configuration files from the host to the container.
2. Sharing source code or build artifacts between the development environment on the Docker host and the container. That is, the Docker container only provides the corresponding development environment, with all source code mapped into the container for debugging. For example:
3. When the file or directory structure on the Docker host ensures consistency with the bind mounts required by the container.

***Example:***

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

::: danger 【Note】
If a bind mount or a non-empty volume is mounted into a directory in the container that already contains some files or directories, those files or directories will be covered by the mount. 
It's like saving files to `/mnt` on a `Linux` host and then mounting a USB drive to `/mnt`. 
The contents of `/mnt` will be overshadowed by the contents of the USB drive until the `USB` drive is unmounted. 
The hidden files will not be deleted or altered, but they will not be accessible when the bind mount or volume is mounted.
:::

---

## Volume

**Applicable Scenarios or Principles for Usage:**

1. Sharing data between multiple running containers. If you do not create it explicitly, a volume will be created the first time it is mounted into a container. The volume will persist even after the container stops or is removed. Multiple containers can simultaneously mount the same volume, either in read-write or read-only mode. The volume will only be deleted when you explicitly remove it. Example:
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
2. When the Docker host cannot guarantee the existence of a given directory or file structure, volumes can help separate the Docker host's configuration from the container's runtime.
3. ~~When you want to store container data on a remote host or cloud provider instead of locally Haven't used it yet~~ :cry:.
4. When you need to `backup`, `restore`, or `migrate` data from one `Docker` host to another, volumes are a better choice. You can stop the containers using the volume and then back up the directory of the volume.
5. When your application requires high-performance I/O on `Docker`. Volumes are stored in a `Linux VM` rather than the host, which means reading and writing have lower latency and higher throughput.
6. When your application requires fully native filesystem behavior on Docker. For example, a database engine needs precise control over disk flushing to ensure transaction durability. Volumes are stored in a Linux virtual machine and can make these guarantees, whereas bind mounts remote to `macOS` or `Windows`, where the filesystem behavior is slightly different.

---

***Example:***

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

::: warning The differences between volume and bind mount:
- Bind mount requires you to manually declare the corresponding directory on the host to mount to a specified directory inside the container, whereas volume is managed by Docker, and you only need to declare the corresponding volume.
- The directory of the filesystem differs across different systems (Mac, Windows, Linux). Bind mount needs to be managed by you, and the permissions are usually only accessible by root, while volumes do not have this restriction.
- When you need to share directories, use volume. Try to avoid using the volume_from keyword.
:::
---

## Cluster Mode

::: warning 【Note】
In cluster mode (Docker Swarm), mounting a single file (configuration file) for data persistence will be different from the single-node mode. The details are explained below.
:::

### 1、Configuration Files

::: tip Containers on multiple nodes share the corresponding configuration.
:::

***Example:***

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

::: warning 【Note】
- Non-Manager nodes cannot create or manage Configs.
- You must remove the corresponding Service before deleting the associated configuration.
- For updating configurations, see the following resources:[Official Documentation](https://docs.docker.com/engine/swarm/configs/#example-rotate-a-config)、[CSDN](https://blog.csdn.net/u013761036/article/details/103650652)
:::

---

### 2、Volume Usage

::: warning 【Note
For now, I have the corresponding nodes create their own volumes, and logs or other content that needs to be viewed are distributed across different nodes. You can use [volume NFS shared storage mode](https://qastack.cn/programming/47756029/how-does-docker-swarm-implement-volume-sharing). Of course, using professional solutions like ELK for cluster log collection is a more elegant approach.】
:::

***Example:***

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

::: tip Under Construction
:construction:
:::
