---
sidebar: [
{text: '🚩 版本控制(Git)', collapsible: true, children:[
{text: '秘钥的配置和使用', 'link': 'knowledge/git/keys'},
{text: '多平台多仓库秘钥管理', 'link': 'knowledge/git/multiple'},
{text: '多人协同开发', 'link': 'knowledge/git/cooperation'},
{text: '常见场景和对策', 'link': 'knowledge/git/qa'},
{text: '其他', 'link': 'knowledge/git/others'},
]},
{text: '✏️ 编辑器(Idea)', collapsible: true, children:[
{text: '快捷键修改', 'link': 'knowledge/idea/keymap'},
{text: 'VCS操作', 'link': 'knowledge/idea/vcs'},
{text: '其他', 'link': 'knowledge/idea/theme'},
]},
{text: '🎁 调试工具', collapsible: true, children: [
{text: '压测工具', 'link': 'knowledge/debug/jmeter'},
{text: 'API测试', 'link': 'knowledge/debug/postman'},
{text: '抓包工具', 'link': 'knowledge/debug/charles'},
]},
{text: '🔭 客户端', collapsible: true, children: [
{text: 'Navicat', 'link': 'knowledge/client/navicat'},
{text: 'Mredis', 'link': 'knowledge/client/mredis'},
{text: 'DockerDesktop', 'link': 'knowledge/client/docker'},
]},
{text: '🍎 Mac工具', collapsible: true, children: [
{text: 'Brew', 'link': 'knowledge/mac/brew'},
{text: 'Iterm2', 'link': 'knowledge/mac/iterm2'},
]},
{text: '🌈 杂项', collapsible: true, children: [
{text: '列表', 'link': 'knowledge/sundry/picgo'},
]}
]

prev: /knowledge/tools
next: /knowledge/git/multiple

---

# 秘钥配置和使用

目录
[[TOC]]

## 创建秘钥

```shell:no-line-numbers
ssh-keygen -t ed25519 -C "test@test.com" -f ~/.ssh/id_for_github_test
```

## 配置秘钥

1. 打开 [ssh配置页面](https://github.com/settings/keys), 并创建新的ssh秘钥。
2. 将创建的 `~/.ssh/id_for_github_test.pub` 内容粘贴，并保存。
3. 本地添加高速缓存, 后续配合多平台多仓库使用 `ssh-add ~/.ssh/id_ed25519`

---

![](https://img.tzf-foryou.xyz/img/20231016114341.png)

## 验证秘钥

```shell:no-line-numbers
ssh -T git@github.com

// 将会得到如下信息:
Hi JerryTZF! You've successfully authenticated, but GitHub does not provide shell access.
```
