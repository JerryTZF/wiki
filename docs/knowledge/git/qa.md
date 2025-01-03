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

prev: /knowledge/git/cooperation
next: /knowledge/git/others
---

# 常见场景和对策

目录
[[TOC]]

## 一、提交了不想提交的文件，如何移除版本库中的该文件

> 例如 `.idea` 、`.DS_Store` 等文件。

```shell:no-line-numbers
# 1. 更新下本地仓库
git pull origin branch
# 2. 删除本地项目目录的缓存
git rm -r --cached .
# 3. 编辑.gitignore需要忽略的文件
# 4. 再次添加文件
git add .
# 5. 提交
git commit -m "add .gitignore"
# 6. 推送代码
git push origin branch
```

## 二、正在开发功能, 但是有紧急bug需要切换分支修复

**方案一**: 提交自己当前分支的代码，然后切换到主分支，创建hotfix分支进行修复，合并，上线。这种方案优缺点：*如果在feature分支其实无伤大雅，
但是如果是公共分支，不建议将未自测或者写一半的代码推上去。*

---

**方案二**: 将当前分支的代码 "暂存" 起来，在自己开发一半的分支 `git stash` 切换出去修改完后回到自己的开发分支，`git stash pop` 弹出继续
工作。**不建议暂存了然后再新增然后再暂存，没这么玩过，但是依旧有解决方案，暂不说明。**

```text:no-line-numbers
步骤一：切换到目前在开发的分支后，git stash 或者 git stash save "保存信息说明"  保存当前的操作。
步骤二：查看"存储"的节点列表 git stash list 
步骤三：查看工作区是否干净 git status -s 或者 git status
步骤四：创建并切换到新的分支 git checkout -b newBranchName
步骤五：查看新的分支状态(此时工作区干净是对的)
步骤六：解决新BUG，提交，上线
步骤七：切回原来的分支，查看下"存储"节点 git stash list 
步骤八：恢复当时存储的节点 git stash apply stash@{0} 查看状态 git status -s 状态恢复为原来的状态
步骤九：不需要之前的存储的节点删除 git stash drop stash@{0}
```

## 三、合并冲突

**产生冲突的场景：**

> - 同一分支下，`pull` 或者 `push` 时，当对同一处代码都有修改时，会产生冲突，要开发自己判断取舍代码。
> - 不同分支 `merge` 时。例如 `feature` 分支的代码合并到 `dev` 时，都对公共部分进行了修改，会产生冲突。
> - 使用 `cherry-pick` 将一个或多个commit合并到另一个分支时，前后的commit如果存在对同一处地方修改，会产生冲突。

---

**解决方案：**

- `pull` 有冲突时，解决冲突后重新提交，将此次修改冲突作为一个新的提交。然后再次 `pull` 合并下，看下是否还有冲突。
- `push` 有冲突时，应该先拉取，然后冲突在本地解决，按照👆🏻的方案即可。
- `merge` 冲突时，一定要判定好使用谁的代码，建议和对方沟通下，然后解决后，提交。

**如何避免冲突：**

- 提交各个分支的拉取频率，尽可能保证每次merge、push前都是最新的代码。
- 不要一个提交包含大量文件和公共部分文件，也就是说，尽可能小步快走，不要一次提交整个功能。

## 四、舍弃相关

### 舍弃未 `add` 文件

```git:no-line-numbers
# 舍弃全部
git checkout .
#舍弃指定文件
git checkout -f a.txt
```

---

### 舍弃 `add` 但未 `commit` 文件

```git:no-line-numbers
# 舍弃所有add的文件
git reset .
# 舍弃指定add过的文件
git reset HEAD a.txt
```

### 舍弃 `commit` 提交

**完全撤销(包含add操作)**

```git:no-line-numbers
# 完全撤销(包含add操作)
git reset --hard HEAD~1
# 如果想撤销两个commit
git reset --hard HEAD~2
# 撤销一个commit，但保留add
git reset --soft HEAD~1
```