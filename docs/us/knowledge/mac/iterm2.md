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

prev: /us/knowledge/mac/brew
next: /us/knowledge/sundry/picgo
---

# Iterm2

目录
[[toc]]

::: tip
MacOS系统下最好用的shell终端。
:::

## 安装

### 官网安装 

[官网安装](https://iterm2.com/downloads.html)

### brew安装

```shell:no-line-numbers
brew install iTerm2  
```

## 基本配置

### 设置为默认终端
![](https://img.tzf-foryou.xyz/img/20231227233156.png)

### 配置连接信息
![](https://img.tzf-foryou.xyz/img/20231227233928.png)

## Oh-My-ZSH

### 安装

```shell:no-line-numbers
#Install oh-my-zsh via curl
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

#Install oh-my-zsh via wget
sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

---

### 修改shell

```shell:no-line-numbers
# 查看当前使用的shell
echo $SHELL
# 查看可用的shell
cat /etc/Shells
# 修改为zsh
chsh -s /bin/zsh
```

### 修改oh-my-zsh主题

**查看可用主题**

```shell:no-line-numbers
ls ~/.oh-my-zsh/themes
```

---

**预览各个主题效果**

[主题效果](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)

---

**修改zsh配置配置oh-my-zsh主题**

```shell:no-line-numbers
echo 'ZSH_THEME="agnoster"' >> ~/.zshrc
source ~/.zshrc
```

---

**安装插件**

> 这里我安装了 `zsh-autosuggestions`、 `git`、`zsh-syntax-highlighting`

```shell:no-line-numbers
# zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting
# zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions.git $ZSH_CUSTOM/plugins/zsh-autosuggestions
# 修改配置
vim ~/.zshrc
# 新增组件
plugins=(zsh-autosuggestions git zsh-syntax-highlighting)
# 使配置生效
source ~/.zshrc
```

---

### 快捷键

- `Ctrl + b` 光标向前移动一个字符，和向左方向键一样。
- `Ctrl + f` 光标向后移动一个字符，和向右方向键一样。
- `Ctrl + d` 删除当前字符。
- `Ctrl + -` 撤销操作。
- `Ctrl + a` 将光标移动到行首的位置。
- `Ctrl + e` 将光标移动到行尾的位置。
- `Ctrl + l` 清空屏幕。
- `Ctrl + k` 从当前光标位置剪切所有内容直到行尾的位置。
- `Ctrl + r` 按下后输入要查找的命令，再按继续往上查找。
- `Ctrl + j` 使用当前搜索到得命令，结束搜索。
- `Ctrl + g` 取消搜索，恢复命令行。