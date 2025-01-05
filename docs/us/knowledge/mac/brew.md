---
sidebar: [
{text: '🚩 Version Control (Git)', collapsible: true, children: [
{text: 'Key Configuration and Usage', 'link': 'knowledge/git/keys'},
{text: 'Multi-platform and Multi-repository Key Management', 'link': 'knowledge/git/multiple'},
{text: 'Collaborative Development', 'link': 'knowledge/git/cooperation'},
{text: 'Common Scenarios and Solutions', 'link': 'knowledge/git/qa'},
{text: 'Others', 'link': 'knowledge/git/others'},
]},
{text: '✏️ Editor (Idea)', collapsible: true, children: [
{text: 'Shortcut Key Modification', 'link': 'knowledge/idea/keymap'},
{text: 'VCS Operations', 'link': 'knowledge/idea/vcs'},
{text: 'Others', 'link': 'knowledge/idea/theme'},
]},
{text: '🎁 Debugging Tools', collapsible: true, children: [
{text: 'Stress Testing Tools', 'link': 'knowledge/debug/jmeter'},
{text: 'API Testing', 'link': 'knowledge/debug/postman'},
{text: 'Packet Sniffing Tools', 'link': 'knowledge/debug/charles'},
]},
{text: '🔭 Client', collapsible: true, children: [
{text: 'Navicat', 'link': 'knowledge/client/navicat'},
{text: 'Mredis', 'link': 'knowledge/client/mredis'},
{text: 'Docker Desktop', 'link': 'knowledge/client/docker'},
]},
{text: '🍎 Mac Tools', collapsible: true, children: [
{text: 'Brew', 'link': 'knowledge/mac/brew'},
{text: 'Iterm2', 'link': 'knowledge/mac/iterm2'},
]},
{text: '🌈 Miscellaneous', collapsible: true, children: [
{text: 'List', 'link': 'knowledge/sundry/picgo'},
]}
]

prev: /us/knowledge/client/docker
next: /us/knowledge/mac/iterm2
---

# Brew

Index
[[toc]]

## Install

```shell:no-line-numbers
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Repository Replacement

::: tip 【Source Repository Types】
- `brew` : Homebrew source code repository
- `homebrew-core` : Homebrew core source
- `homebrew-cask` : Repository for MacOS applications and large binary installations
- `homebrew-bottles` : Precompiled binary software packages
:::

---

### Brew Resource 

::: tabs
@tab 中科大
```shell:no-line-numbers
git -C "$(brew --repo)" remote set-url origin https://mirrors.ustc.edu.cn/brew.git
```
@tab 阿里巴巴
```shell:no-line-numbers
git -C "$(brew --repo)" remote set-url origin https://mirrors.aliyun.com/homebrew/brew.git
```
@tab 清华大学
```shell:no-line-numbers
git -C "$(brew --repo)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git
```
:::

---

### Core Resource

::: tabs
@tab 中科大
```shell:no-line-numbers
git -C "$(brew --repo homebrew/core)" remote set-url origin https://mirrors.ustc.edu.cn/homebrew-core.git
```
@tab 阿里巴巴
```shell:no-line-numbers
git -C "$(brew --repo homebrew/core)" remote set-url origin https://mirrors.aliyun.com/homebrew/homebrew-core.git
```
@tab 清华大学
```shell:no-line-numbers
git -C "$(brew --repo homebrew/core)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git
```
:::

### Cask Resource

::: tabs
@tab 中科大
```shell:no-line-numbers
git -C "$(brew --repo homebrew/cask)" remote set-url origin https://mirrors.ustc.edu.cn/homebrew-cask.git
```
@tab 阿里巴巴
```shell:no-line-numbers
git -C "$(brew --repo homebrew/cask)" remote set-url origin https://mirrors.aliyun.com/homebrew/homebrew-cask.git
```
@tab 清华大学
```shell:no-line-numbers
git -C "$(brew --repo homebrew/cask)" remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-cask.git
```
:::

---

### Bottles Resource

> If your shell is `zsh`, write to `zshrc`; if it is bash, write to `bash_profile`.


::: tabs
@tab 中科大
```shell:no-line-numbers
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles/bottles' >> ~/.zshrc
```
@tab 阿里巴巴
```shell:no-line-numbers
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.aliyun.com/homebrew/homebrew-bottles' >> ~/.zshrc
echo 'export HOMEBREW_API_DOMAIN=https://mirrors.aliyun.com/homebrew/homebrew-bottles/api' >> ~/.zshrc
```
@tab 清华大学
```shell:no-line-numbers
echo 'export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/bottles' >> ~/.zshrc
```
:::

---

Finally, refresh the configuration.

```shell:no-line-numbers
source ~/.zshrc
```

## Restore the source.

```shell:no-line-numbers
git -C "$(brew --repo)" remote set-url origin https://github.com/Homebrew/brew.git
git -C "$(brew --repo homebrew/core)" remote set-url origin https://github.com/Homebrew/homebrew-core.git
git -C "$(brew --repo homebrew/cask)" remote set-url origin https://github.com/Homebrew/homebrew-cask.git
sed '/export HOMEBREW_BOTTLE_DOMAIN/'d ~/.zshrc
source ~/.zshrc
brew update
```

---

## Commonly Used Commands.

```shell:no-line-numbers
# 搜索包
brew search node
# 安装最新版
brew install node
# 安装指定版本
brew install node@14.16.8
# 查看已安装的包列表
brew list
# 查看某个包的详细信息
brew info node
# 清除安装缓存
brew cleanup
# 更新brew
brew update
# 更新软件包
brew upgrade node
# 卸载软件包
brew uninstall node
# 查看brew配置
brew config
# 诊断brew
brew doctor
# 开启、关闭、重启服务
brew service start|stop|restart nginx
# 服务列表
brew services list
```

## Install an older version of PHP.

::: tip
The newer versions of the Homebrew repository only offer PHP versions starting from `7.4`, which poses a challenge for projects requiring older versions of PHP.
:::

---

### Add the repository for older versions of PHP.

```shell:no-line-numbers
brew tap shivammathur/php
```

At this point, you should be able to locate various versions of PHP for selection.
![](https://img.tzf-foryou.xyz/img/20231227225241.png)

### Switching between multiple versions

```shell:no-line-numbers
# 安装php版本切换器
brew install brew-php-switcher
# 切换版本
brew-php-switcher 8.1
```