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

prev: /us/knowledge/docker/docker-compose
next: /us/knowledge/docker/k8s

---

# Docker swarm

Index
[[TOC]]

## 1、What is Docker Swarm

Docker's native container orchestration tool that allows you to combine multiple Docker hosts into a single virtual Docker host. This enables containers to form cross-host subnet networks. By executing commands, you can communicate with a single main Swarm instead of interacting with each Docker Engine individually. With flexible scheduling strategies, teams can better manage available host resources, ensuring the efficient operation of application containers.

## 2、Advantages of Docker Swarm

- Dynamic scaling: You can dynamically deploy services to the corresponding machines (replicated, global).
- Cluster service dynamic routing: Supported by the ingress routing mesh.
- Dynamic scaling and node failure handling: Supports dynamic scaling up or down, and automatic discovery and removal of unavailable nodes.

## 3、Cluster Setup

::: tip
Here, we use one Alibaba Cloud instance (Manager) and two Tencent Cloud instances (Workers) as an example.
Ps: Normally, cluster setup would be done within a data center or a local area network (LAN), 
but here we are setting up the cluster across two public machines. 
Additionally, we also need to set up our own internal network. 
For this, I am using [ZeroTier](https://my.zerotier.com/network/e5cd7a9e1c096a33), and you can refer to this [internal network tutorial](https://zhuanlan.zhihu.com/p/383471270).
:sunglasses:

The security groups for the `ECS` instances here need to open some ports.

![](https://img.tzf-foryou.xyz/img/20220405225239.png)

![](https://img.tzf-foryou.xyz/img/20220405225409.png)

Port explanations:\
`4789`：Port 4789 is used for container network entry via UDP. The default for Docker Swarm is 4789, but why is it set to 5789 here? Because Alibaba Cloud does not open the 4789 UDP port by default. :cry:\
`7946`：Port 7946 TCP/UDP is used for container network discovery.\
You can refer to the above two ports here: [Use swarm mode routing mesh](https://docs.docker.com/engine/swarm/ingress/)\
`2377`：This is the default port used to communicate with other swarm members for API access and overlay network address announcements.

Detail to see：[docker swarm init](https://docs.docker.com/engine/reference/commandline/swarm_init/) search `2377`。
:::

### 3-1、Initialize Manager

```shell:no-line-numbers
docker swarm init --advertise-addr 10.147.18.171:2377 --data-path-addr 10.147.18.171 --data-path-port 5789
```

::: warning 10.147.18.171 is the IP you set in Zerotier.
:::

---

### 3-2、Join Worker

```shell:no-line-numbers
docker swarm join --token SWMTKN-1-4a4oznjmnvmkzn801ktr77enqcfvef66oxxxxxxxxxxxx-1d8eqa89161a1rcz3ozfqt4iz 10.147.18.171:2377
```

---

> You can view node information on the Manager. It is recommended to modify the `Hostname` before joining the node for easier identification.

![](https://img.tzf-foryou.xyz/img/20220406102016.png)

---

### 3-3、Create Overlay Network

```shell
docker network create -d overlay --attachable proxy
```

### 3-4、Write Stack File

::: warning

Here are a few key points to keep in mind when writing a stack file:
- image cannot be dynamically built; it must be an already built image.
- docker stack does not support docker-compose.yml files based on version 2. The version must be at least 3. However, Docker Compose can still handle files with versions 2 and 3.
- For data sharing in the cluster, you can use remote volume mounts (NFS) for the volume.
:::

For details about some key fields of the cluster, see Cluster：[deploy](https://docs.docker.com/compose/compose-file/deploy/)\
Here are a few examples to refer to my stack file。【Note】traefik config ~~后面~~ :sunglasses:  单独记[笔记](harvest/traefik/overview.md)再介绍。
- [bitwarden-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/bitwarden-stack.yml)
- [nginx-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/nginx-stack.yml)
- [portainer-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/portainer-stack.yml)
- [traefik-stack.yml](https://github.com/JerryTZF/hyperf-demo/blob/main/docs/traefik-stack.yml)

---

Example of a data volume binding directory:

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

Example of a binding file:

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

### 3-5、Start and Manage

```shell:no-line-numbers
sudo docker stack deploy --with-registry-auth -c vuepress-stack.yml vuepress
```

## 4、Swarm Network

### 4-1、Service Discovery

In Docker Swarm Mode, each node's Docker engine has a built-in DNS server. The DNS servers of different nodes communicate with each other through the gossip protocol of the control plane. Note: This DNS server is used for service discovery between containers.

Swarm mode assigns a DNS entry to each service that is connected to a custom network (e.g., an overlay network). Note: Currently, the network must be custom, such as an overlay network. Services on bridge and routing mesh networks do not receive DNS entries.

### 4-2、LB(load balance)

::: tip
Docker Swarm mode has two types of load balancing modes: 1. Internal Load Balancing and 2. Ingress Load Balancing. Here, we focus on Ingress Load Balancing.
:::

---

Ingress Load Balancing can expose services from the container network to the host network, allowing them to be accessed externally.

In Swarm mode, Docker creates a default overlay network called the ingress network. Additionally, Docker creates a special network namespace (sandbox) on each worker node called ingress_sbox. The ingress_sbox has two endpoints:

- One endpoint connects to the ingress network.
- The other endpoint connects to the local bridge network, docker_gwbridge.

The IP range for the ingress network is 10.255.0.0/16, and all routing mesh services share this IP space. This allows the swarm to handle external traffic efficiently, directing it to the appropriate service across the cluster.






