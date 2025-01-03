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

prev: /us/knowledge/git/multiple
next: /us/knowledge/git/qa
---

# Collaborative Development

Index
[[TOC]]

## Common Branches

- **master(main)**: The main version branch, usually used as the production branch, and protected to prevent direct commits.
- **develop(dev)**: The development branch, where feature branches' code is merged for development and testing. This branch typically progresses quickly.
- **release(rel)**: The pre-release branch, which is the branch before going live. It generally keeps pace with the master branch.
- **feature(feat)**: Feature branches, where different features or functionalities are developed.
- **bugfix(hotfix)**: Branches used for urgent bug fixes or critical functionality changes for the production environment.

---

## Commit Conventions

The commit messages should follow a standard convention to describe the type and purpose of the current commit.

- feat: New feature or functionality.
- fix: Bug fix.
- docs: Documentation update.
- style(format): Code formatting changes.
- revert: Rollback commit.

---

## Standard Workflow

::: tip 【Note】
Here, we explain using the `master`, `develop`, `release`, and `feature` branches.
:::

---

1. Pull the latest `master` branch and create your feature branch from it for daily development.
2. Always ensure that your local `master`, `develop`, `release`, and `feature` branches are up to date. (Frequent updates and ensure the latest version before merging)
3. Develop the `new feature` in your feature branch.
4. Merge the `feature` branch into the `develop` branch and push the `develop` branch to the remote repository.
5. Test the code on the develop branch. If there are issues, repeat steps 4 and 5 until no issues remain.
6. Merge the `feature` branch into the `release` branch (resolve conflicts if any), push the `release` branch, and perform pre-release testing.
7. Test the code on the `release` branch. If there are issues, repeat steps 6 and 7 until no issues remain.
8. Submit a PR (MR) to merge from the release branch into the master branch.
