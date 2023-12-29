---
sidebar: [
{text: '🔧 包管理', link: '/zh/knowledge/linux/package'},
{text: '🌈 常用命令', link: '/zh/knowledge/linux/command'},
{text: '🖌 Vim', link: '/zh/knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: '/zh/knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: '/zh/knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: '/zh/knowledge/linux/crontab'},
]

prev: /zh/knowledge/linux/command
next: /zh/knowledge/linux/systemctl

---

# Vim

目录
[[TOC]]

## 光标移动

- h 或 向左箭头键(←)
- j 或 向下箭头键(↓)
- k 或 向上箭头键(↑)
- l 或 向右箭头键(→)
- H : 移动到当前屏幕最上方
- M：移动到当前屏幕最中间
- L：移动到当前屏幕最下方
- G：移动到当前文档最下方
- NG(N为数字)：移动到文档的第N行
- gg：移动到文档第一行
- ctrl+b：向上移动一屏
- ctrl+f：向下移动一屏

::: tip 【注意】
如果想要进行多次移动的话，例如向下移动 30 行，可以使用 “30j” 或 “30↓” 的组合按键， 亦即加上想要进行的次数(数字)后，按下动作即可！
:::

## 搜索替换

- /word：向光标之下寻找一个名称为 word 的字符串
- ?word：向光标之上寻找一个名称为 word 的字符串
- n：查找下一个
- N：查找上一个
- :%s/word1/word2/g：从第一行到最后一行寻找 word1 字符串，并将该字符串取代为 word2 ！(常用)
- n1,n2s/word1/word2/g：在第 n1 与 n2 行之间寻找 word1 这个字符串，并将该字符串取代为 word2


## 复制粘贴

- x, X：在一行字当中，x 为向后删除一个字符 (相当于 [del] 按键)， X 为向前删除一个字符(相当于 [backspace] 亦即是退格键) (常用)
- dd：删除游标所在的一行
- ndd：n 为数字。删除光标所在的向下 n 行，例如 20dd 则是删除 20 行 (常用)
- yy：复制当前行
- nyy：n 为数字。复制光标所在的向下 n 行，例如 20yy 则是复制 20 行(常用)
- d1G：删除光标所在到第一行的所有数据
- dG：删除光标所在到最后一行的所有数据
- y1G：复制游标所在行到第一行的所有数据
- yG：复制游标所在行到最后一行的所有数据
- p, P：p 为将已复制的数据在光标下一行贴上，P 则为贴在游标上一行