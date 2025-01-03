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

prev: /knowledge/git/multiple
next: /knowledge/git/qa
---

# 多人协同开发

目录
[[TOC]]

## 常用分支

- **master(main)**: 主版本分支，一般常用作线上分支，且受保护，不允许直接提交。
- **develop(dev)**: 开发分支，一般将功能分支的代码合并到开发分支，用于开发测试用。该分支的版本进度一般很快。
- **release(rel)**: 预发布分支，上线前所在的分支，一般情况和master分支保持相似进度。
- **feature(feat)**: 功能分支，不同的功能特性所在的开发分支。
- **bugfix(hotfix)**: 对于线上一些紧急bug或者着急需要变更的功能所在的分支。

---

## 提交规范

对于commit的说明应该遵循一套规范来说明当前提交是什么类型和功能。

- feat: 新增功能，特性。
- fix: bug修复。
- docs: 文档修改。
- style(format): 格式修改。
- revert: 回滚提交。

---

## 常规流程

::: tip 【注意】
这里以 `master`、`develop`、`release`、`feature` 分支进行说明。
:::

---

1. 从 master 分支拉取自己的feature分支，在此分支进行日常开发。
2. 请时刻保证自己本地的 master 、 develop 、 release 、 feature 处于最新版本。(勤拉取更新代码，合并前保证最新版本)
3. 自己的 feature 分支开发新功能。
4. 将 feature 分支合并到 develop 分支，推送 develop 分支到远端。
5. 在 develop 分支进行测试代码，有问题重复4、5步骤，直至无问题。
6. 将 feature 分支合并到 release 分支(有冲突解决冲突)，推送 release 分支，进行预发布测试。
7. 在 release 分支进行预发布测试，有问题重复6、7步骤，直至无问题。
8. 提PR(MR)，从 release 分支往 master 分支合并。
