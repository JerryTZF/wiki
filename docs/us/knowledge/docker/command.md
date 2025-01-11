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

prev: /us/knowledge/docker/network
next: /us/knowledge/docker/docker-compose

---

# Commands

Index
[[TOC]]

## Image Related

```shell:no-line-numbers
# List local images
docker images [-a: include intermediate images; -q: display only image IDs; --no-trunc: show detailed information]
# Remove an image
docker rmi [-f: force removal; --no-prune: do not remove the intermediate images, default is to remove them]
# Build an image using Dockerfile
docker build [-f: specify the Dockerfile path; --rm: remove intermediate containers after successful build; -t (--tag): set the image name or version (name:v3); -q: output only the image ID after build]
# View the creation history of a specific image
docker history imageName
# Save a specific image as a tar archive file
docker save [-o: output file]  # docker save -o my_ubuntu_v3.tar runoob/ubuntu:v3
# Import an image exported using docker save
docker load [-q: quiet output; -i: specify the file to import, replace STDIN]
# exp1: docker load < busybox.tar.gz; exp2: docker load --input fedora.tar
# Pull or update a specific image from the image repository
docker pull imageName
# Upload the local image to the image repository, you must log in to the repository first
docker push imageName
# Search in the repository
docker search imageName
```

## Container Related

```shell:no-line-numbers
# Create a new container and run a command
docker run [-d: run in the background, return container ID; -it: enter the terminal; -h: specify the container's hostname; --name: container name; --link: add a link to another container] imageName:TAG
# Start, stop, or restart a container
docker start|stop|restart
# Remove a container
docker rm CONTAINER [CONTAINER...] [-f: force]
# Create a container but do not start it
docker create
# List containers
docker ps [-a: include stopped containers; -l: show the most recently created container; -n: list the last n created containers; -q: quiet mode, show only container IDs]
# Get metadata for a container/image
docker inspect CONTAINER/IMAGE # Get container IP: docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' CONTAINER
# View the processes running in a container
docker top CONTAINER
# Get the container's logs
docker logs [-f: follow log output; -t: show timestamps; --tail: show only the last N container logs; --since: show logs from a specific start time]
# View port mappings
docker port CONTAINER
```

## Network Related

```shell:no-line-numbers
# Create a network (default is bridge)
docker network create netName
# Connect a container to a network. You can connect a container by name or ID
docker network connect [OPTIONS] netName containerName
# Disconnect a container from a network. The container must be running to disconnect it from the network
docker network disconnect [OPTIONS] netName containerName
# Return information about one or more networks. By default, this command presents all results in a JSON object
docker network inspect [OPTIONS] netName [netName2...]
# Remove all unused networks. Unused networks are those that are not referenced by any containers
docker network prune [OPTIONS]
# List networks
docker network ls [OPTIONS]
# Remove one or more networks by name or identifier. To remove a network, you must first disconnect all containers from it
docker network rm netName [netName2...]
```

## Volume Related

```shell:no-line-numbers
# Create a new volume for containers to use and store data. If no name is specified, Docker will generate a random name
docker volume create [OPTIONS] [VOLUME]
# Return relevant information about a volume
docker volume inspect [OPTIONS] VOLUME [VOLUME...]
# Remove all unused local volumes. Unused local volumes are those not referenced by any containers
docker volume prune [OPTIONS]
# Remove one or more volumes. You cannot remove volumes that are being used by containers
docker volume rm [OPTIONS] VOLUME [VOLUME...]
```

## Resource Usage

```shell:no-line-numbers
# Display real-time container resource usage statistics
docker stats [OPTIONS] [CONTAINER...]
```

## Common `docker-compose` Commands

```shell:no-line-numbers
# Build and start containers (can also use up -d to directly update after yml file changes)
docker-compose up [-d: run in the background] [IMAGE]
# Remove all containers and images
docker-compose down
# Show all containers
docker-compose ps
# Validate the docker-compose.yml file format
docker-compose config -q
# Build images
docker-compose build
# Enter a container
docker-compose exec CONTAINER bash
# Remove a container
docker-compose rm CONTAINER
# Restart containers
docker-compose restart
```

## Docker Swarm Related

```shell:no-line-numbers
docker swarm --help
# Display and rotate the root CA
docker swarm ca --help
# Initialize a swarm
docker swarm init --help
# Join a swarm as a node and/or manager
docker swarm join --help
# Manage join tokens
docker swarm join-token --help
# Leave the swarm
docker swarm leave --help
# Unlock swarm
docker swarm unlock --help
# Manage the unlock key
docker swarm unlock-key --help
# Update the swarm
docker swarm update --help
```

## Docker Stack Related

```shell:no-line-numbers
# Deploy a new stack or update an existing stack
docker stack deploy --help
# List stacks
docker stack ls --help
# List the tasks in the stack
docker stack ps --help
# Remove one or more stacks
docker stack rm --help
# List the services in the stack
docker stack services --help
```

## Docker Service Related

```shell:no-line-numbers
# Create a new service
docker service create
# Display detailed information on one or more services
docker service inspect
# Fetch the logs of a service or task
docker service logs
# List services
docker service ls
# List the tasks of one or more services
docker service ps
# Remove one or more services
docker service rm
# Revert changes to a service's configuration
docker service rollback
# Scale one or multiple replicated services
docker service scale
# Update a service
docker service update
```

## Clear Container Logs

```shell:no-line-numbers
echo "" > $(docker inspect --format='{{.LogPath}}' <containerID>)
```