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

prev: /us/knowledge/git/cooperation
next: /us/knowledge/git/others
---

# Common Scenarios and Solutions

Index
[[TOC]]

## 1、How to Remove a File from the Version Control That You Didn't Want to Commit

> For example, files like `.idea`, `.DS_Store`, etc.

```shell:no-line-numbers
# 1. Update your local repository
git pull origin branch
# 2. Remove cached files in the local project directory
git rm -r --cached .
# 3. Edit .gitignore to include files that should be ignored
# 4. Re-add the files
git add .
# 5. Commit the changes
git commit -m "add .gitignore"
# 6. Push the code
git push origin branch

```

## 2、Developing a Feature, But There's an Urgent Bug That Requires Switching Branches to Fix

**Solution 1**: Commit the code in your current feature branch, then switch to the main branch, create a hotfix branch, fix the bug, merge it, 
and deploy. Pros and cons of this solution: **If you are in a feature branch, it doesn't hurt much, but if it's a shared branch, it's not recommended to push untested or incomplete code**.

---

**方案二**: 将当前分支的代码 "暂存" 起来，在自己开发一半的分支 `git stash` 切换出去修改完后回到自己的开发分支，`git stash pop` 弹出继续
工作。**不建议暂存了然后再新增然后再暂存，没这么玩过，但是依旧有解决方案，暂不说明。**

Solution 2: Temporarily "stash" your changes in the current branch using `git stash`, switch to the bugfix branch, fix the issue,
and then return to your feature branch and apply the stashed changes using `git stash pop`.
It's not recommended to stash, add new changes, and then stash again, though there are solutions to that, which will not be explained here.

```text:no-line-numbers
Step 1: After switching to your current development branch, run git stash or git stash save "description" to save your current work.
Step 2: View the list of stashed items with git stash list.
Step 3: Check if your workspace is clean with git status -s or git status.
Step 4: Create and switch to the new branch git checkout -b newBranchName.
Step 5: Check the status of the new branch (workspace should be clean at this point).
Step 6: Resolve the bug, commit, and deploy.
Step 7: Switch back to your original branch and check the stash list with git stash list.
Step 8: Restore the stashed changes with git stash apply stash@{0}, and check the status with git status -s to restore to the original state.
Step 9: If you no longer need the stashed changes, remove them with git stash drop stash@{0}.

```

## 3、Merge Conflicts

**Scenarios that Cause Conflicts:**

> - Within the same branch, conflicts occur when both parties modify the same part of the code during a `pull` or `push`. Developers need to decide which code to keep.
> - During a `merge` between different branches. For example, if code from the feature branch is merged into `dev` and both have modified the same parts, a conflict occurs.
> - Using `cherry-pick` to merge one or more commits into another branch. If the commits modify the same code, a conflict arises.

---

**Solutions:**

- If there is a conflict during `pull`, resolve the conflict, commit the change as a new commit, and then pull again to check if any conflicts remain.
- If there is a conflict during `push`, pull first, resolve the conflict locally, and follow the steps above.
- If there is a conflict during `merge`, you must decide which code to use. It is recommended to communicate with others and resolve the conflict before committing.

**How to Avoid Conflicts:**

- Regularly pull from branches to minimize conflicts. Always ensure that your branch is up to date before merging or pushing.
- Avoid committing a large number of files, especially shared files, in one go. It is better to commit in small, frequent increments and not submit an entire feature in a single commit.

## 4、Discarding Changes

### Discard Unstaged Changes

```git:no-line-numbers
# Discard all changes
git checkout .
# Discard a specific file
git checkout -f a.txt

```

---

### Discard Changes After `add` But Not Yet `commit`

```git:no-line-numbers
# Discard all added files
git reset .
# Discard a specific added file
git reset HEAD a.txt

```

### Discard a `Commit`

**Completely Undo (Including `add` Operations)**

```git:no-line-numbers
# Completely undo (including `add` operations)
git reset --hard HEAD~1
# If you want to undo two commits
git reset --hard HEAD~2
# Undo one commit but keep `add` operations
git reset --soft HEAD~1

```