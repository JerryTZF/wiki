---
sidebar: [
{text: '🚩 版本控制(Git)', collapsible: true, children:[
{text: '秘钥的配置和使用', 'link': '/zh/knowledge/git/keys'},
{text: '多平台多仓库秘钥管理', 'link': '/zh/knowledge/git/multiple'},
{text: '多人协同开发', 'link': '/zh/knowledge/git/cooperation'},
{text: '常见场景和对策', 'link': '/zh/knowledge/git/qa'},
{text: '其他', 'link': '/zh/knowledge/git/others'},
]},
{text: '✏️ 编辑器(Idea)', collapsible: true, children:[
{text: '快捷键修改', 'link': '/zh/knowledge/idea/keymap'},
{text: 'VCS操作', 'link': '/zh/knowledge/idea/vcs'},
{text: '其他', 'link': '/zh/knowledge/idea/theme'},
]},
{text: '🎁 调试工具', collapsible: true, children: [
{text: '压测工具', 'link': '/zh/knowledge/debug/jmeter'},
{text: 'API测试', 'link': '/zh/knowledge/debug/postman'},
{text: '抓包工具', 'link': '/zh/knowledge/debug/charles'},
]},
{text: '🔭 客户端', collapsible: true, children: [
{text: 'Navicat', 'link': '/zh/knowledge/client/navicat'},
{text: 'Mredis', 'link': '/zh/knowledge/client/mredis'},
{text: 'DockerDesktop', 'link': '/zh/knowledge/client/docker'},
]},
{text: '🍎 Mac工具', collapsible: true, children: [
{text: 'Brew', 'link': '/zh/knowledge/mac/brew'},
{text: 'Iterm2', 'link': '/zh/knowledge/mac/iterm2'},
]},
{text: '🌈 杂项', collapsible: true, children: [
{text: '列表', 'link': '/zh/knowledge/sundry/picgo'},
]}
]

prev: /zh/knowledge/idea/keymap
next: /zh/knowledge/idea/theme
---

# VCS操作

目录
[[TOC]]

## 拉取代码

> 该操作不会合并。除非本地有提交。 \
> git -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune

![](https://img.tzf-foryou.xyz/img/20231031152638.png)

## 推送代码

> 提交和合并说明 

- 点击右上角 :white_check_mark: 提交按钮。
- 左侧出现对话框，勾选要提交和推送的文件。
- 点击右侧 "提交并推送"。
- 推送前，建议对比下差异。

---

## 合并代码

> 演示：dev 分支代码合并到 master 。 

- 切换到 master 分支。
- 菜单栏选择：git->merge->选择指定分支->合并->解决冲突->应用->推送合并提交。

图示：
![](https://img.tzf-foryou.xyz/img/20231031164303.png)
![](https://img.tzf-foryou.xyz/img/20231031165531.png)
![](https://img.tzf-foryou.xyz/img/20231031165618.png)

## 指定文件和指定分支做对比

## cherry-pick优选

## 指定文件提交历史

## 回退版本