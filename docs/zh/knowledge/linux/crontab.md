---
sidebar: [
{text: '🔧 包管理', link: '/zh/knowledge/linux/package'},
{text: '🌈 常用命令', link: '/zh/knowledge/linux/command'},
{text: '🖌 Vim', link: '/zh/knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: '/zh/knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: '/zh/knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: '/zh/knowledge/linux/crontab'},
]

prev: /zh/knowledge/linux/supervisorctl
next: /zh/knowledge/linux

---

# Crontab

目录
[[TOC]]

**选项：**

> -e：编辑该用户的计时器设置；\
> -l：列出该用户的计时器设置；\
> -r：删除该用户的计时器设置；\
> -u<用户名称>：指定要设定计时器的用户名称;

---

- **系统周期性所要执行的工作，比如写缓存数据到硬盘、日志清理等。在`/etc`目录下有一个crontab文件，这个就是系统任务调度的配置文件。**
- **用户定期要执行的工作，比如用户数据备份、定时邮件提醒等。用户可以使用 crontab 工具来定制自己的计划任务。所有用户定义的crontab文件都被保存在`/var/spool/cron`目录中**

---

**模板文件：**

```shell:no-line-numbers
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

# 指定系统使用何种shell
SHELL=/bin/sh
# 指定了系统执行命令的路径
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# 指定了crond的任务执行信息将通过电子邮件发送给root用户
MAILTO=root

# For details see man 4 crontabs

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed
```

---

**示例：**

```shell:no-line-numbers
# 将脚本内容写入空设备
*/5 * * * * /root/XXXX.sh &>/dev/null 2>&1 
# 将脚本内容写入指定文件
*/5 * * * * /root/XXXX.sh > /tmp/load.log 2>&1 &
```

```shell:no-line-numbers
# 每分钟执行一次
* * * * * command
# 每小时的第3和第15分钟执行
3,15 * * * * command
# 在上午8点到11点的第3和第15分钟执行
3,15 8-11 * * * command
# 每个星期一的上午8点到11点的第3和第15分钟执行
3,15 8-11 * * 1 command
# 每晚的21:30重启smb 
30 21 * * * /etc/init.d/smb restart
# 每月1、10、22日的4 : 45重启smb
45 4 1,10,22 * * /etc/init.d/smb restart
# 每周六、周日的1:10重启smb
10 1 * * 6,0 /etc/init.d/smb restart
# 每天18 : 00至23 : 00之间每隔30分钟重启smb
0,30 18-23 * * * /etc/init.d/smb restart
# 晚上11点到早上7点之间，每隔一小时重启smb
* 23-7/1 * * * /etc/init.d/smb restart
# 每月的4号与每周一到周三的11点重启smb 
0 11 4 * mon-wed /etc/init.d/smb restart
# 一月一号的4点重启smb
0 4 1 jan * /etc/init.d/smb restart
```

::: tip 【注意】
crontab文件中一定要使用全局路径，包括自己编写的sh脚本。
:::