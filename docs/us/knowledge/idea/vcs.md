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

prev: /us/knowledge/idea/keymap
next: /us/knowledge/idea/theme
---

# VCS Operations

Index
[[TOC]]

## Pull Code

> This operation does not merge unless there are local commits. \
> git -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune

![](https://img.tzf-foryou.xyz/img/20231031152638.png)

## Push Code

> Commit and merge instructions

- Click the commit button :white_check_mark: at the top right.
- A dialog will appear on the left, select the files to commit and push.
- Click "Commit and Push" on the right.
- It is recommended to check the differences before pushing.

---

## Merge Code

> Example: Merging code from `dev` branch into `master`.

- Switch to the `master` branch.
- From the menu bar, select: git -> merge -> select the branch -> merge -> resolve conflicts -> apply -> push merge commit.

Images：
![](https://img.tzf-foryou.xyz/img/20231031164303.png)
![](https://img.tzf-foryou.xyz/img/20231031165531.png)
![](https://img.tzf-foryou.xyz/img/20231031165618.png)

## Compare Specific Files and Branches

> Right-click -> git -> Compare with branch -> Select the branch

![](https://img.tzf-foryou.xyz/img/20231031165931.png)

## cherry-pick Best Practices

::: tip
- `cherry-pick` simply means merging one or more commits from one branch into another.
- For example, merge a few commits from `main` branch into `dev` branch.
- Conflicts may arise during the merge, and the solution is the same as the merge code process outlined above.
:::

::: warning 【Note】
[cherry-pick pitfalls](https://cloud.tencent.com/developer/article/2356684)
:::

---

![](https://img.tzf-foryou.xyz/img/20231031171450.png)


## View Commit History of a Specific File

> Right-click -> git -> Show history

## Rollback Version

> Select the corresponding branch, then select the commit to roll back to, and perform the rollback. Image:

![](https://img.tzf-foryou.xyz/img/20231031170855.png)