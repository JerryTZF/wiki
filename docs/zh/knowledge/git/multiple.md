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

prev: /zh/knowledge/git/keys
next: /zh/knowledge/git/cooperation
---

# 多平台多仓库使用

目录
[[TOC]]

::: tip 场景
自己的项目和公司的项目可能并不在一个托管平台，但是需要在一台机器上进行开发。
:::

---

一、 创建不同托管平台的秘钥对。

```shell:no-line-numbers
ssh-keygen -t ed25519 -C "JerryTZF@github.com" -f ~/.ssh/id_github
ssh-keygen -t ed25519 -C "JerryTZF@gitlab.com" -f ~/.ssh/id_gitlab
ssh-keygen -t ed25519 -C "JerryTZF@gitee.com" -f ~/.ssh/id_gitee
```

二、将不同平台的私钥加入ssh-agent

```shell:no-line-numbers
ssh-add ~/.ssh/id_github
ssh-add ~/.ssh/id_gitlab
ssh-add ~/.ssh/id_gitee
```

三、编写配置文件

```shell:no-line-numbers
vim ~/.ssh/config
```

```yaml:no-line-numbers
# company
Host gitee.com
HostName gitee.com
User JerryTZF
PreferredAuthentications publickey
IdentityFile ~/.ssh/id_company

# myself
Host github.com
HostName github.com
User JerryTZF
PreferredAuthentications publickey
IdentityFile ~/.ssh/id_myself
```

四、测试

```shell:no-line-numbers
ssh -T git@github.com
ssh -T git@gitee.com
```