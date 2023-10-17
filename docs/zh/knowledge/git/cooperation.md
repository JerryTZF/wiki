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

prev: /zh/knowledge/git/multiple
next: /zh/knowledge/git/qa
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

1. 从master分支拉取自己的feature分支，在此分支进行日常开发。
2. 请时刻保证自己本地的master、develop、release、feature处于最新版本。(勤拉取更新代码，合并前保证最新版本)
3. 自己的feature分支开发新功能。
4. 将feature分支合并到develop分支，推送develop分支到远端。
5. 在develop分支进行测试代码，有问题重复4、5步骤，直至无问题。
6. 将feature分支合并到release分支(有冲突解决冲突)，推送release分支，进行预发布测试。
7. 在release分支进行预发布测试，有问题重复6、7步骤，直至无问题。
8. 提PR(MR)，从release分支往master分支合并。
