---
sidebar: [
{text: '🔧 包管理', link: '/zh/knowledge/linux/package'},
{text: '🌈 常用命令', link: '/zh/knowledge/linux/command'},
{text: '🖌 Vim', link: '/zh/knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: '/zh/knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: '/zh/knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: '/zh/knowledge/linux/crontab'},
]

prev: /zh/knowledge/linux/package
next: /zh/knowledge/linux/vim

---

# 常用命令

目录
[[TOC]]

## 解压缩

> .tar

```shell:no-line-numbers
# 解包:
tar xvf FileName.tar 
# 打包:
tar cvf FileName.tar DirName
```

---

> .tar.gz | .tgz

```shell:no-line-numbers
# 解压:
tar zxvf FileName.tar.gz
# 压缩:
tar zcvf FileName.tar.gz DirName
```

---

> .gz

```shell:no-line-numbers
# 解压:
gunzip FileName.gz
gzip -d FileName.gz
# 压缩:
gzip FileName
```

---

> .zip

```shell:no-line-numbers
# 解压:
unzip FileName.zip 
# 压缩:
zip FileName.zip DirName
# 压缩一个目录使用 -r 参数，-r 递归。例： $ zip -r FileName.zip DirName
```

---

> .rar

```shell:no-line-numbers
# 解压:
rar x FileName.rar
# 压缩:
rar a FileName.rar DirName
```

---

## 匹配查找

### grep 参数

> **-a** 不要忽略二进制数据。\
**-A**<显示列数> 除了显示符合范本样式的那一行之外，并显示该行之后的内容。\
**-b** 在显示符合范本样式的那一行之外，并显示该行之前的内容。\
**-c** 计算符合范本样式的列数。\
**-C<显示列数>或-<显示列数>**  除了显示符合范本样式的那一列之外，并显示该列之前后的内容。\
**-d<进行动作>** 当指定要查找的是目录而非文件时，必须使用这项参数，否则grep命令将回报信息并停止动作。\
**-e<范本样式>** 指定字符串作为查找文件内容的范本样式。\
**-E** 将范本样式为延伸的普通表示法来使用，意味着使用能使用扩展正则表达式。\
**-f<范本文件>** 指定范本文件，其内容有一个或多个范本样式，让grep查找符合范本条件的文件内容，格式为每一列的范本样式\
**-F** 将范本样式视为固定字符串的列表。\
**-G** 将范本样式视为普通的表示法来使用。\
**-h** 在显示符合范本样式的那一列之前，不标示该列所属的文件名称。\
**-H** 在显示符合范本样式的那一列之前，标示该列的文件名称。\
**-i** 忽略字符大小写的差别。\
**-l** 列出文件内容符合指定的范本样式的文件名称\
**-L** 列出文件内容不符合指定的范本样式的文件名称。\
**-n** 在显示符合范本样式的那一列之前，标示出该列的编号\
**-q** 不显示任何信息。\
**-R/-r**此参数的效果和指定“-d recurse”参数相同。\
**-s** 不显示错误信息。\
**-v** 反转查找。\
**-x** 只显示全列符合的列。\
**-y** 此参数效果跟“-i”相同。\
**-o** 只输出文件中匹配到的部分

---

### grep 示例

```shell:no-line-numbers
# 查询指定内容
grep "xxx" fileName --color
# 反向查找
grep -v "xxx" fileName --color
# 多文件查找
grep "xxx" file1 file2 file3...
# 显示行号查找
grep "xxx" -n fileName
# 多个文件中哪些指定文件存在要查找的内容
grep -l "xxx" file1 file2 file3...
# 严格匹配"词"
grep -w "xxx" fileName
# 递归查找
grep -rn "xxx" dir
# 正则表达式
grep -E "regrex_express" fileName
# 统计出现次数
grep -E "regrex_express" fileName | wc -l
# 只输出文本中匹配到的内容
grep -o "xxx" fileName
# 匹配多个内容
grep -o -e "xxx" -e "sss" fileName
# 指定类型文件搜索
grep "main{}" . -r --include *.{php,html}
# 显示匹配某个结果之后的3行，使用 -A 选项
grep "xxx" -A 3
# 显示匹配某个结果之前的3行，使用 -B 选项
grep "xxx" -B 3
# 显示匹配某个结果前后的3行，使用 -C 选项
grep "xxx" -C 3
```

## 文件查找

### find 参数

> find 在文件系统中搜索某文件

- 根据 文件或目录名称 搜索
  - find [搜索目录] [-name或者-iname] [搜索字符]
- 根据 文件大小 搜索 
  - find [搜索目录] [-size] [+/- 20K | 50M] 
- 根据时间搜索【在过去N分钟内修改过的文件】 
  - find [搜索目录] [-cmin] [+/- 13] 
- 根据时间搜索【再过去N天内被修改的文件】
  - find [搜索目录] [-ctime] [+/- 3]
- 根据文件权限搜索
  - find [搜索目录] [-perm] [777]
- 根据文件类型进行搜索
  - find [搜索目录] [-type] [f|l|d|s]

### find 示例

```shell:no-line-numbers
# 查找当前目录下以".txt" 和 ".pdf" 结尾的文件
find . -name "*.txt" -o -name "*.pdf"
# 查找路径
find /usr -path "*local"
# 查找home目录下不是以 ".txt"结尾的文件
find /home ! -name "*.txt"
# 目录深度为3的所有普通文件
find . -maxdepth=3 -type f
# 搜索最近7天被访问过的文件
find . -type f -atime -7
# 搜索超过最近7天内被访问的文件
find . -type f -atime +7
# 搜索访问时间超过10分钟的所有文件
find . -type f -amin +10
```

---

## 下载

### wget 参数

> -b：进行后台的方式运行wget；\
-d：调试模式运行指令；\
-h：显示指令帮助信息；\
-q：不显示指令执行过程；\
-v：显示详细执行过程；\
-c：继续执行上次终端的任务；\
-i<文件>：从指定文件获取要下载的URL地址；\
-O: 允许动态路由下载

### wget 示例

```shell:no-line-numbers
# 普通单独下载文件
wget http://www.linuxde.net/testfile.zip
# 下载并以不同的文件名保存
wget -O wordpress.zip http://www.linuxde.net/download.aspx?id=1080
# 限速下载(默认会吃满带宽)
wget --limit-rate=300k http://www.linuxde.net/testfile.zip
# 断点续传
wget -c http://www.linuxde.net/testfile.zip
# 后台下载(大文件时使用,可以使用tail -f wget-log查看进度)
wget -b http://www.linuxde.net/testfile.zip
# 设置重试次数下载
wget --tries=40 http://www.linuxde.net/testfile.zip
# 多文件同步下载
# STEP-1 创建url列表文件
cat urls.txt
#url1
#url2
#url3
# step-2 下载
wget -i urls.txt
```

## Http请求

### 下载相关

```shell:no-line-numbers
# 显示进度条下载远程文件到localtext.iso
curl http://man.linuxde.net/text.iso -o localtext.iso --progress
# 断点续传
curl -C <offset> http://man.linuxde.net/text.iso
# 分块下载
curl -r 0-1000 -o file_part1.JPG http://www.linux.com/file.JPG
curl -r 1000-2000 -o file_part2.JPG http://www.linux.com/file.JPG
curl -r 2000-3000 -o file_part3.JPG http://www.linux.com/file.JPG
cat file_part* > file.JPG
```

---

### 请求相关

```shell:no-line-numbers
# 设置referer
curl --referer http://www.google.com http://www.baidu.com
# 设置Cookie
curl --cookie "user=root;pwd=123456" http://www.google.com
# 只打印头信息
curl -I http://www.google.com
# 显示错误信息
curl -f http://www.google.com
# 显示声明何种http方法
curl -X [POST|GET|HEAD]
# 显示声明header头(1 多个header多次指定;2 默认x-www-form-urlencode)
curl -H "Content-Type:application/json" -H "X-Requested-With:XMLHttpRequest"
# 添加参数
curl -d '{"name":"jerry","sex":"M"}'
# 不校验SSL
curl -k 
# POST请求
curl -I -H "Content-Type:application/json" -H "X-Requested-With:XMLHttpRequest" -X POST -d '{"name":"jerry","sex":"M"}' http://www.url.com/api.json
```

## 性能相关

### top 参数

> -b：以批处理模式操作；\
-c：显示完整的治命令；\
-d：**屏幕刷新间隔时间**；\
-I：忽略失效过程；\
-s：保密模式；\
-S：累积模式；\
-i<时间>：设置间隔时间；\
-u<用户名>：指定用户名；\
-p<进程号>：指定进程；\
-n<次数>：循环显示的次数。


### 交互命令

::: tip 【注意】
进入top前台后可以进行交互，这些命令都是单字母的，如果在命令行中使用了-s选项， 其中一些命令可能会被屏蔽。
:::

---

> k：终止一个进程；\
i：忽略闲置和僵死进程，这是一个开关式命令；\
q：退出程序；\
r：重新安排一个进程的优先级别；\
S：切换到累计模式；\
s：改变两次刷新之间的延迟时间（单位为s），如果有小数，就换算成ms。输入0值则系统将不断刷新，默认值是5s；\
f或者F：从当前显示中添加或者删除项目；\
o或者O：改变显示项目的顺序；\
l：切换显示平均负载和启动时间信息；\
m：**切换显示内存信息**；\
t：**切换显示进程和CPU状态信息**；\
c：切换显示命令名称和完整命令行；\
M：**根据驻留内存大小进行排序**；\
P：**根据CPU使用百分比大小进行排序**；\
T：根据时间/累计时间进行排序；\
w：将当前设置写入~/.toprc文件中；\
1：显示多核CPU详细信息。

### 进程相关字段说明

- PID = (Process Id) 进程Id
- USER = (User Name) 进程所有者的用户名
- NI = (Nice value) nice值。负值表示高优先级，正值表示低优先级
- VIRT = (Virtual Image (kb)) 进程使用的虚拟内存总量，单位kb。VIRT=SWAP+RES
- RES = (Resident size (kb)) 进程使用的、未被换出的物理内存大小，单位kb。RES=CODE+DATA
- S = (Process Status) 进程状态。D=不可中断的睡眠状态,R=运行,S=睡眠,T=跟踪/停止,Z=僵尸进程
- %CPU = (CPU usage) 上次更新到现在的CPU时间占用百分比
- %MEM = (Memory usage (RES)) 进程使用的物理内存百分比
- CODE = (Code size (kb)) 可执行代码占用的物理内存大小，单位kb
- DATA = (Data+Stack size (kb)) 可执行代码以外的部分(数据段+栈)占用的物理内存大小，单位kb
- COMMAND = (Command name/line) 命令名/命令行
- SWAP = (Swapped size (kb)) 进程使用的虚拟内存中，被换出的大小，单位kb
- P = (Last used cpu (SMP)) 最后使用的CPU，仅在多CPU环境下有意义

---

## 文件内容查看

```shell:no-line-numbers
# 查看文件且带有行号
cat -n
# 以分页形式查看文件(space:下一页;b:上一页;q:退出)
more +20 fileName
# 查看文件头部内容
head fileName
# 查看文件尾部内容
tail fileName
```

---

## 磁盘信息

```shell:no-line-numbers
# 硬盘使用情况
df -h 
# 数据盘挂载情况
lsblk
# 查看指定目录文件大小
du -sh * | sort -nr
```

## 进程查看相关

```shell:no-line-numbers
# 显示进程
ps -aux | less
# 查找进程
ps -aux | grep "XXX"
# 父子进程树状查看
ps -axjf
# 查看进程内的线程
ps -L {PID}
# 按照CPU使用率排序(大->小)
ps -aux --sort -pcpu | less
# 按照MEM使用大小排序(大->小)
ps -aux --sort -pmem | less
```







