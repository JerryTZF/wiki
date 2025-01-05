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

Index
[[toc]]

::: tip
The most optimal shell terminal for MacOS system.
:::

## Install

### Install from the official website

[Install](https://iterm2.com/downloads.html)

### Brew Install

```shell:no-line-numbers
brew install iTerm2  
```

## Foundational Setup.

### Establish as the default terminal.
![](https://img.tzf-foryou.xyz/img/20231227233156.png)

### Configure the connection information.
![](https://img.tzf-foryou.xyz/img/20231227233928.png)

## Oh-My-ZSH

### Install

```shell:no-line-numbers
#Install oh-my-zsh via curl
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

#Install oh-my-zsh via wget
sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

---

### Switch Shell

```shell:no-line-numbers
# 查看当前使用的shell
echo $SHELL
# 查看可用的shell
cat /etc/Shells
# 修改为zsh
chsh -s /bin/zsh
```

### Modify The oh-my-zsh Theme.

**View available themes.**

```shell:no-line-numbers
ls ~/.oh-my-zsh/themes
```

---

**Preview the effects of various themes.**

[主题效果](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)

---

**Modify the zsh configuration to set up the oh-my-zsh theme.**

```shell:no-line-numbers
echo 'ZSH_THEME="agnoster"' >> ~/.zshrc
source ~/.zshrc
```

---

**Install plugins.**

> Here, I have installed `zsh-autosuggestions`, `git`, and `zsh-syntax-highlighting`.

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

### Keyboard Shortcuts

- `Ctrl + b`: Moves the cursor one character backward, akin to the left arrow key.
- `Ctrl + f`: Moves the cursor one character forward, similar to the right arrow key.
- `Ctrl + d`: Deletes the current character.
- `Ctrl + -`: Performs an undo operation.
- `Ctrl + a`: Positions the cursor at the beginning of the line.
- `Ctrl + e`: Positions the cursor at the end of the line.
- `Ctrl + l`: Clears the screen.
- `Ctrl + k`: Cuts all content from the current cursor position to the end of the line.
- `Ctrl + r`: Press to input the command to be searched for, then press to continue searching upward.
- `Ctrl + j`: Utilizes the currently found command to conclude the search.
- `Ctrl + g`: Cancels the search, restoring the command line.