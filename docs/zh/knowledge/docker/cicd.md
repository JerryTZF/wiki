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

prev: /zh/knowledge/docker/docker
next: /zh/knowledge/docker/volume

---

# CI/CD

目录
[[toc]]

::: tip 主要流程
1. 本地编码。
2. 推送代码。(push remote repository)
3. 构建镜像。(github build image)
4. 推送镜像。(github push image to target image repository)
5. 服务器拉取镜像。
6. 容器重启。
:::

---

## 构建工作流文件

```text:no-line-numbers
# 目录结构
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
        
# 这里推荐几个好用的Action构建镜像的Action工具
# https://github.com/marketplace/actions/customizable-docker-buildx
# https://github.com/marketplace/actions/push-to-registry
# https://github.com/marketplace/actions/publish-docker-action
```

## 阿里云镜像管理触发器

使用阿里云触发器管理镜像更新Action

::: tip
1、可以实现一个 `web server` 接收阿里云的 `webhook` 然后主动拉取更新镜像。\
2、`watchTower` 容器也可以实现监听所有容器的镜像是否为最新版，是则拉取更新。
:::