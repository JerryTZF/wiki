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

prev: /us/knowledge/tools
next: /us/knowledge/git/multiple

---

# Key Configuration and Usage

目录
[[TOC]]

## Create Key

```shell:no-line-numbers
ssh-keygen -t ed25519 -C "test@test.com" -f ~/.ssh/id_for_github_test
```

## Configure Key

1. Open the [SSH](https://github.com/settings/keys) configuration page and create a new SSH key.
2. Paste the content of `~/.ssh/id_for_github_test.pub` and save.
3. Add the key to the local cache, and for future use with multiple platforms and repositories, run `ssh-add ~/.ssh/id_ed25519`.

---

![](https://img.tzf-foryou.xyz/img/20231016114341.png)

## Verify Key

```shell:no-line-numbers
ssh -T git@github.com

// You will get the following message:
Hi JerryTZF! You've successfully authenticated, but GitHub does not provide shell access.
```
