---
sidebar: [
{text: '🔧 包管理', link: 'knowledge/linux/package'},
{text: '🌈 常用命令', link: 'knowledge/linux/command'},
{text: '🖌 Vim', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /knowledge/linux/vim
next: /knowledge/linux/supervisorctl

---

# Systemctl

目录
[[TOC]]

::: tip Systemctl是一个systemd工具，主要负责控制systemd系统和服务管理器；
:::

---

## 配置文件

::: tip Unit
Systemd引入了一个核心配置：Unit（单元配置）。事实上，Systemd管理的每个进程，都是一个Unit。相当于任务块。一个有12种模式：
- Service unit：系统服务
- Target unit：多个Unit构成的一个组
- Device Unit：硬件设备
- Mount Unit：文件系统的挂载点
- Automount Unit：自动挂载点
- Path Unit：文件或路径
- Scope Unit：不是由 Systemd 启动的外部进程
- Slice Unit：进程组
- Snapshot Unit：Systemd 快照，可以切回某个快照
- Socket Unit：进程间通信的 socket
- Swap Unit：swap 文件
- Timer Unit：定时器

---

【注意】
不同的配置文件的后缀就是不同的 `Unit` 。我这里都会以 `Service` 举例。
:::

### 配置文件路径

```shell:no-line-numbers
# 普通服务配置文件路径
/usr/lib/systemd/system/
# 系统执行过程中所产生的服务脚本,这些脚本的优先级比上面的高
/run/systemd/system/
# 管理员根据主机系统的需求所建立的执行脚本，优先级比上面的高
/etc/systemd/system/
```

### 配置文件详解


```text:no-line-numbers
Unit
  Description，服务的描述
  Documentation，文档介绍
  After，该服务要在什么服务启动之后启动，比如Mysql需要在network和syslog启动之后再启动
Install
  WantedBy，值是一个或多个Target，当前Unit激活时(enable)符号链接会放入/etc/systemd/system目录下面以Target名+.wants后缀构成的子目录中
  RequiredBy，它的值是一个或多个Target，当前Unit激活(enable)时，符号链接会放入/etc/systemd/system目录下面以Target名+.required后缀构成的子目录中
  Alias，当前Unit可用于启动的别名
  Also，当前Unit激活(enable)时，会被同时激活的其他Unit
Service
  Type，定义启动时的进程行为。它有以下几种值。
  Type=simple，默认值，执行ExecStart指定的命令，启动主进程
  Type=forking，以 fork 方式从父进程创建子进程，创建后父进程会立即退出
  Type=oneshot，一次性进程，Systemd 会等当前服务退出，再继续往下执行
  Type=dbus，当前服务通过D-Bus启动
  Type=notify，当前服务启动完毕，会通知Systemd，再继续往下执行
  Type=idle，若有其他任务执行完毕，当前服务才会运行
  ExecStart，启动当前服务的命令
  ExecStartPre，启动当前服务之前执行的命令
  ExecStartPost，启动当前服务之后执行的命令
  ExecReload，重启当前服务时执行的命令
  ExecStop，停止当前服务时执行的命令
  ExecStopPost，停止当其服务之后执行的命令
  RestartSec，自动重启当前服务间隔的秒数
  Restart，定义何种情况 Systemd 会自动重启当前服务，可能的值包括always（总是重启）、on-success、on-failure、on-abnormal、on-abort、on-watchdog
  TimeoutSec，定义 Systemd 停止当前服务之前等待的秒数
  Environment，指定环境变量
```

### Nginx配置示例

```ini:no-line-numbers
# Stop dance for nginx
# =======================
#
# ExecStop sends SIGSTOP (graceful stop) to the nginx process.
# If, after 5s (--retry QUIT/5) nginx is still running, systemd takes control
# and sends SIGTERM (fast shutdown) to the main process.
# After another 5s (TimeoutStopSec=5), and if nginx is alive, systemd sends
# SIGKILL to all the remaining processes in the process group (KillMode=mixed).
#
# nginx signals reference doc:
# https://nginx.org/en/docs/control.html
#
[Unit]
Description=A high performance web server and a reverse proxy server
Documentation=man:nginx(8)
After=network.target nss-lookup.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'
ExecReload=/usr/sbin/nginx -g 'daemon on; master_process on;' -s reload
ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /run/nginx.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

## 常用命令

```shell:no-line-numbers
# 立即启动一个服务
systemctl start nginx.service
# 立即停止一个服务
systemctl stop nginx.service
# 重启一个服务
systemctl restart nginx.service
# 杀死一个服务的所有子进程
systemctl kill nginx.service
# 重新加载一个服务的配置文件
systemctl reload nginx.service
# 重载所有修改过的配置文件
systemctl daemon-reload
# 显示某个 Unit 的所有底层参数
systemctl show nginx.service
# 显示某个 Unit 的指定属性的值
systemctl show -p CPUShares nginx.service
# 设置某个 Unit 的指定属性
systemctl set-property nginx.service CPUShares=500
# 开机自启
systemctl enable nginx.service
# 取消开机自启
systemctl disable nginx.service
# 查看服务状态
systemctl status nginx.service
# 查看配置文件内容
systemctl cat ningx.service
```