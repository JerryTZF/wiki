---
sidebar: [
{text: '🚩 版本控制(Git)', collapsible: true, children:[
{text: '秘钥的配置和使用', 'link': '/zh/knowledge/git/keys'},
{text: '多平台多仓库秘钥管理', 'link': '/zh/knowledge/git/multiple'},
{text: '多人协同开发', 'link': '/zh/knowledge/git/cooperation'},
{text: '常见场景和对策', 'link': '/zh/knowledge/git/qa'},
{text: '其他', 'link': '/zh/knowledge/git/others'},
]},
{text: '✏️ 编辑器(Idea)', collapsible: true, children:[
{text: '快捷键修改', 'link': '/zh/knowledge/idea/keymap'},
{text: 'VCS操作', 'link': '/zh/knowledge/idea/vcs'},
{text: '其他', 'link': '/zh/knowledge/idea/theme'},
]},
{text: '🎁 调试工具', collapsible: true, children: [
{text: '压测工具', 'link': '/zh/knowledge/debug/jmeter'},
{text: 'API测试', 'link': '/zh/knowledge/debug/postman'},
{text: '抓包工具', 'link': '/zh/knowledge/debug/charles'},
]},
{text: '🔭 客户端', collapsible: true, children: [
{text: 'Navicat', 'link': '/zh/knowledge/client/navicat'},
{text: 'Mredis', 'link': '/zh/knowledge/client/mredis'},
{text: 'DockerDesktop', 'link': '/zh/knowledge/client/docker'},
]},
{text: '🍎 Mac工具', collapsible: true, children: [
{text: 'Brew', 'link': '/zh/knowledge/mac/brew'},
{text: 'Iterm2', 'link': '/zh/knowledge/mac/iterm2'},
]},
{text: '🌈 杂项', collapsible: true, children: [
{text: '列表', 'link': '/zh/knowledge/sundry/picgo'},
]}
]

prev: /zh/knowledge/git/others
next: /zh/knowledge/idea/vcs
---

# 快捷键

> 常用快捷键操作(变更为自己适用的) 

**全局查找**
```text:no-line-numbers
setting->keymap->mainmune->edit->find->find in path 改为: alt+f
```

**全局根据文件名查找对应文件**
```text:no-line-numbers
mainmune->navigate->file 改为: alt+n
```

**上一步**
```text:no-line-numbers
mainmune->navigate->back 改为: alt+b
```

**下一步**
```text:no-line-numbers
mainmune->navigate->forward 改为: alt+a
```

**关闭当前文件**
```text:no-line-numbers
mainmune->windows->editor tabs->close 改为: alt+d
```

**直接跳转到错误的地方**
```text:no-line-numbers
shift+F2
```

**快速搜索该类中所有的成员变量和成员方法**
```text:no-line-numbers
alt+F12
```

**替换当前文件中指定的内容**
```text:no-line-numbers
ctrl+r
```

**折叠当前代码块**
```text:no-line-numbers
ctrl + `-`	打开  ctrl + `+`
```

**打开当前项目所在的目录**
```text:no-line-numbers
ctrl + alt + F12
```

**打开当前类的所有方法**
```text:no-line-numbers
ctrl+shift+	'+'
```

**折叠当前类的所有方法**
```text:no-line-numbers
Ctrl+shift+	'-'  ；然后 Ctrl +  '+'
```

**多行光标**
```text:no-line-numbers
多行光标 Alt + 鼠标左键(多次点击即可)
```

**选中代码块大小写变更**
```text:no-line-numbers
CTRL+SHIFT+U
```

**数组对齐**
```text:no-line-numbers
PhpStorm > Preference > Editor > Code Style > PHP > Wrapper and Braces > Align key-value pairs
```