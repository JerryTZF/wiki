---
sidebar: [
{text: '🔧 包管理', link: 'knowledge/linux/package'},
{text: '🌈 常用命令', link: 'knowledge/linux/command'},
{text: '🖌 Vim', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /knowledge/linux/systemctl
next: /knowledge/linux/crontab

---

# Supervisorctl

目录
[[TOC]]

::: tip Supervisorctl
`Supervisor` 是一个 Python 编写的进程管理工具，可以方便的 启动、重启、关闭 单个或多个进程。\
`Supervisorctl` 是 `Supervisor` 的命令客户端。
:::

::: warning 多服务依赖启动暂不介绍。
详情参见: [https://www.supervisord.org/](https://www.supervisord.org/)
:::

## 安装

::: tabs
@tab Ubuntu
```shell:no-line-numbers
apt-get install supervisor
```
@tab CentOS
```shell:no-line-numbers
# 安装 epel 源，如果此前安装过，此步骤跳过
yum install -y epel-release
yum install -y supervisor  
```
@tab MacOS
```shell:no-line-numbers
brew install supervisor  
```
:::


## 配置文件

::: tabs
@tab Supervisor配置文件
```shell:no-line-numbers
; supervisor config file

[unix_http_server]
file=/var/run/supervisor.sock   ; (the path to the socket file)
chmod=0700                       ; sockef file mode (default 0700)

[supervisord]
logfile=/var/log/supervisor/supervisord.log ; (main log file;default $CWD/supervisord.log)
pidfile=/var/run/supervisord.pid ; (supervisord pidfile;default supervisord.pid)
childlogdir=/var/log/supervisor            ; ('AUTO' child log dir, default $TEMP)

; the below section must remain in the config file for RPC
; (supervisorctl/web interface) to work, additional interfaces may be
; added by defining them in separate rpcinterface: sections
[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock ; use a unix:// URL  for a unix socket

; The [include] section can just contain the "files" setting.  This
; setting can list multiple files (separated by whitespace or
; newlines).  It can also contain wildcards.  The filenames are
; interpreted as relative to this file.  Included files *cannot*
; include files themselves.

[include]
files = /etc/supervisor/conf.d/*.conf  
```
@tab 示例配置
```shell:no-line-numbers
[program:app] ; 程序名称，在 supervisorctl 中通过这个值来对程序进行一系列的操作
autorestart=True      ; 程序异常退出后自动重启
autostart=True        ; 在 supervisord 启动的时候也自动启动
redirect_stderr=True  ; 把 stderr 重定向到 stdout，默认 false
environment=PATH="/home/app_env/bin"  ; 可以通过 environment 来添加需要的环境变量，一种常见的用法是使用指定的 virtualenv 环境
command=python server.py  ; 启动命令，与手动在命令行启动的命令是一样的
user=ubuntu           ; 用哪个用户启动
directory=/home/app/  ; 程序的启动目录
stdout_logfile_maxbytes = 20MB  ; stdout 日志文件大小，默认 50MB
stdout_logfile_backups = 20     ; stdout 日志文件备份数
; stdout 日志文件，需要注意当指定目录不存在时无法正常启动，所以需要手动创建目录（supervisord 会自动创建日志文件）
stdout_logfile = /data/logs/usercenter_stdout.log
```
@tab Hyperf 配置文件
```shell:no-line-numbers
# 新建一个应用并设置一个名称，这里设置为 hyperf
[program:hyperf]
# 设置命令在指定的目录内执行
directory=/your/path/hyperf-v3
# 这里为您要管理的项目的启动命令
command=php ./bin/hyperf.php start
# 以哪个用户来运行该进程
user=root
# supervisor 启动时自动该应用
autostart=true
# 进程退出后自动重启进程
autorestart=true
# 进程持续运行多久才认为是启动成功
startsecs=1
# 重试次数
startretries=3
# stderr 日志输出位置
stderr_logfile=/your/path/hyperf-v3/runtime/stderr.log
# stdout 日志输出位置
stdout_logfile=/your/path/hyperf-v3/runtime/stdout.log
```
:::

## 管理 Supervisor

::: tip
使用 `systemctl` 管理。[参考这里](knowledge/linux/systemctl.html)
:::

---

> systemctl cat supervisor.service

```shell:no-line-numbers
[Unit]
Description=Supervisor process control system for UNIX
Documentation=http://supervisord.org
After=network.target

[Service]
ExecStart=/usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
ExecStop=/usr/bin/supervisorctl $OPTIONS shutdown
ExecReload=/usr/bin/supervisorctl -c /etc/supervisor/supervisord.conf $OPTIONS reload
KillMode=process
Restart=on-failure
RestartSec=50s

[Install]
WantedBy=multi-user.target
```

**启动Supervisor**

```shell:no-line-numbers
systemctl start supervisor.service
```

**开机启动Supervisor**

```shell:no-line-numbers
systemctl enable supervisor.service
```

## 管理 Hyperf 服务

::: tabs
@tab 启动 Hyperf
```shell:no-line-numbers
supervisorctl start hyperf
```
@tab 重启 Hyperf
```shell:no-line-numbers
supervisorctl restart hyperf  
```
@tab 停止 Hyperf
```shell:no-line-numbers
supervisorctl stop hyperf
```
@tab 查看 Hyperf 状态
```shell:no-line-numbers
supervisorctl status hyperf
```
:::

## 常用命令

```shell:no-line-numbers
# 停止 Supervisor 自己
supervisorctl shutdown
# 启动 Supervisor 自己
supervisord -c /etc/supervisor/supervisord.conf
# 重新加载 Supervisor 配置并启动
supervisorctl reload
# 启动supervisord管理的所有进程 
supervisorctl start all
# 停止supervisord管理的所有进程
supervisorctl stop all
# 展示所有管理的服务状态
supervisorctl status
# 查看服务标准输出日志
supervisorctl tail -f [service_name]
# 清除服务输出日志
supervisorctl clear [service_name]
# 获取服务的进程IP
supervisorctl pid [service_name]
# 从管理的服务中移除某个服务
supervisorctl remove [service_name]
```