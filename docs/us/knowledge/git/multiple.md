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

prev: /us/knowledge/git/keys
next: /us/knowledge/git/cooperation
---

# Multi-Platform and Multi-Repository Usage

Index
[[TOC]]

::: tip Scenario
Your personal project and the company project may not be on the same hosting platform, but you need to develop on a single machine.
:::

---

1. Create key pairs for different hosting platforms.

```shell:no-line-numbers
ssh-keygen -t ed25519 -C "JerryTZF@github.com" -f ~/.ssh/id_github
ssh-keygen -t ed25519 -C "JerryTZF@gitlab.com" -f ~/.ssh/id_gitlab
ssh-keygen -t ed25519 -C "JerryTZF@gitee.com" -f ~/.ssh/id_gitee
```

2. Add private keys of different platforms to the ssh-agent

```shell:no-line-numbers
ssh-add ~/.ssh/id_github
ssh-add ~/.ssh/id_gitlab
ssh-add ~/.ssh/id_gitee
```

3. Write the configuration file

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

4. Test

```shell:no-line-numbers
ssh -T git@github.com
ssh -T git@gitee.com
```