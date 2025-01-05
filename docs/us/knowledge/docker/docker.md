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

prev: /us/knowledge/container
next: /us/knowledge/docker/cicd

---

# Docker

Index
[[toc]]


::: warning The reason behind my initial adoption of Docker.
Before using Docker, we should identify our demands and pain points, and then ascertain whether Docker can address those challenges.

---

For instance, in my case:

- Swoole could not run on Windows (though it can now 😊), but Docker's virtualization can effectively provide the corresponding environment.
- There are inconsistencies in the PHP versions required by multiple projects, necessitating the configuration of several virtual hosts on Nginx.
- Code maintenance proves to be exceptionally cumbersome, with multiple environments and versions; sometimes it is necessary to examine the code in detail to distinguish them, while attention to minute code intricacies is also often required. :cry:
- Colleagues unfamiliar with my projects face a daunting task in getting them up and running, as they need to configure numerous settings. Often, they merely wish to see the results, which compels me to invest additional time in communication.

:::

---

## 1、What is Docker

Docker is a <font color="red">**virtualization environment technology**</font>, akin to `VMware` and `VirtualBox`, fundamentally serving the purpose of environment isolation. It facilitates a relative independence among projects, resulting in a clearer hierarchical structure.


## 2、Docker's Advantages

- Convenient and rapid delivery
- Bundling projects with their environments for robust isolation
- Lower maintenance costs

## 3、Principles of Utilization

- It is recommended in principle to deploy only one application per container, with inter-application communication occurring through inter-container communication mechanisms.
- When building custom images, it is advised to use the most streamlined base image to reduce image size.
- In cases where multiple containers (services) can be categorized, custom networks are recommended. These containers should be placed within a custom network inaccessible to others.
- For scenarios where multiple containers need to share data, it's preferable to use shared volumes instead of shared containers.


## 4、Install

- [ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [centos](https://docs.docker.com/engine/install/centos/)
- [windows desktop](https://docs.docker.com/desktop/windows/install/)
- [mac desktop](https://docs.docker.com/desktop/mac/install/)
- [docker compose](https://docs.docker.com/compose/install/)

---

::: tip Changing the Mirror Source
- Obtain the acceleration address: Navigate to => https://cr.console.aliyun.com/cn-shenzhen/instances/mirrors => 镜像加速器
- Edit the configuration: Modify (or create if it does not exist) /etc/docker/daemon.json and add: `{"registry-mirrors": ["https://xxxxxxx.mirror.aliyuncs.com"]}`
- Restart: Execute `systemctl daemon-reload` followed by `systemctl restart docker`
:::

---

## 5、The Essence

### 5-1、Image

- Grounded on the kernel of the host machine, layered for overlay, serving as a packaging tool for software runtime environments and file systems developed on those environments.
- **<font color="red">A static, read-only layered structure</font>**: Static, akin to code that remains idle, merely textual characters awaiting execution; read-only, signifying that during image construction, it's akin to constructing a file system where content remains unaltered until runtime; layered structure: Each image builds upon a foundational image, thereby reconstructed atop this foundational base.
- Our projects or environments are founded on a base image, subsequently enriched with environment setups, project code, and related content.

---

::: tip
- When crafting a custom image, it is imperative to define a `Dockerfile` to augment our desired functionalities atop a base image. For instance:eg: [custom LNMP](https://github.com/JerryTZF/fpm-nginx-image/blob/main/lnmp-image/php8.0-fpm/Dockerfile)
- Several official images provide access to various startup or auxiliary tools internally. While deploying official images, it is advisable to peruse the documentation on `Docker Hub` for detailed insights.
:::

---

### 5-2、Containers

- A container operates at runtime, encompassing all the requisite environments for a project, including the system, code, dependencies, and language settings.
- Containers are isolated from one another through a sandbox mechanism, ensuring that they do not interfere with each other.
- Any modifications to a container—whether adding, deleting, or altering files—occur solely within the container layer. Only the container layer is writable; all underlying image layers remain read-only. This means that changes made within a container do not affect other containers dependent upon the same image.

---

![Struct](https://img.tzf-foryou.xyz/img/20231228224707.png)

::: warning 【Note】
In a simplified analogy, images and containers can be likened to classes and objects. Before instantiating a class, it merely defines relationships such as environments and dependencies. Only after an object is instantiated can operations be performed on it. However, the class itself remains unchanged, and creating a new object does not reflect any modifications made to previous objects.
:::

### 5-3、Network

> The network configurations in Docker are fundamentally categorized into four modes:

- **Host**: In host mode, when launching a container, it shares the same Network Namespace with the host instead of obtaining an independent one. The container does not create its virtual network card or configure its unique IP; rather, it utilizes the host's IP address and ports.

- **Container**: This mode involves sharing a Network Namespace between a newly created container and an existing one, granting them shared IP addresses and port ranges within the specified container, as opposed to sharing the host's Network Namespace.

- **None**: Operating in none mode means the Docker container possesses its individual Network Namespace without any predefined network configurations. This implies the Docker container lacks network interfaces, IP addresses, routing information, requiring manual addition of network interfaces and IP configurations.

- **Bridge**: The bridge mode, being Docker's default network setting, allocates a distinct Network Namespace for each container, configuring IP addresses, and connects Docker containers on a host to a virtual bridge network.

- **overlay2**：The overlay network is designed to interconnect Docker containers across different machines, enabling communication between containers on diverse hosts while supporting message encryption.

---

![Bridge](https://img.tzf-foryou.xyz/img/20220331194017.png)

---

::: warning 【Warning】
- To facilitate communication between multiple containers, ensure they are within the same network.
- For a collection of servers serving different functions, it is preferable to segregate them into distinct networks. For instance, place frontend servers such as server1, server2, etc., in one network, and backend servers like server1, server2, etc., in another network.
- There is no necessity to orchestrate different services within the same `docker-compose.yml` file if they belong to the same network.
:::

### 5-4、Volume

**Functionality**：

- Data Persistence: Data generated by the container can be retained on disk even after the container is removed.
- Data Sharing: Data can be shared among containers.
- Dynamic Modification: Certain configuration files can be mapped for real-time updates.

---

**The three types of volume mappings.**：

![docker file system](https://img.tzf-foryou.xyz/img/20220410204852.png)

1. bind mount

> Bind a specified directory in the container to a specified directory on the host machine.

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
You can view the type of volume mapping through the following method.
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

> Bind a specified directory in the container to a volume path managed by Docker.

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
The volumes managed by Docker are located in the directory below.
```shell:no-line-numbers
ls /var/lib/docker/volumes/
```
:::

---

3. tmpfs mount

Stored in memory, these are seldom utilized and require no extensive introduction. :stuck_out_tongue:

::: danger 【Note】
In cluster mode (Docker Swarm), operations such as "remote volumes" and "shared volumes" are available, which are elaborately discussed in the section on "Volume Usage."
:::

---

