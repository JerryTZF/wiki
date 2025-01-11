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

prev: /us/knowledge/docker/docker
next: /us/knowledge/docker/volume

---

# CI/CD

目录
[[toc]]

::: tip Main Process
1. Local coding.
2. Push code. (push remote repository)
3. Build image. (github build image)
4. Push image. (github push image to target image repository)
5. Server pulls image.
6. Container restart.
:::

---

## Build Workflow File

```text:no-line-numbers
# Directory structure
.github
	|- workflows
		|- main.yml
app
Dockerfile
```
---

> main.yml

```yml:no-line-numbers
name: Build and Publish Docker
on: [push]
jobs: 
  build:
	runs-on: ubuntu-latest
  	name: Build image job
	steps:
  	  - name: Checkout master
      uses: actions/checkout@master
      - name: Build and publish image
      # 这里的工具是Actions广场查找使用的,如果你想更换,在广场搜索即可
      # https://github.com/marketplace/actions
      uses: ilteoood/docker_buildx@master
      with:
    	repository: namespace-image/image-name # 命名空间/镜像名称
        registry: registry.cn-shenzhen.aliyuncs.com # 仓库地址
        username: "xxx" # 仓库用户
        password: "xxx" # 仓库密码
        auto_tag: true
        
# Here are some recommended Action tools for building images:
# https://github.com/marketplace/actions/customizable-docker-buildx
# https://github.com/marketplace/actions/push-to-registry
# https://github.com/marketplace/actions/publish-docker-action
```

## Alibaba Cloud Image Management Trigger

Use Alibaba Cloud trigger to manage image update actions.

::: tip
1. You can implement a `web server` to receive Alibaba Cloud's `webhook` and then actively pull the updated image.
2. The `watchTower` container can also monitor whether all containers' images are up-to-date, and if so, it will pull updates.
:::