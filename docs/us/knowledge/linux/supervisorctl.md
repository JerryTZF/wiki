---
sidebar: [
{text: '🔧 Package Management', link: 'knowledge/linux/package'},
{text: '🌈 Common Commands', link: 'knowledge/linux/command'},
{text: '🖌 Vim Editor', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /us/knowledge/linux/systemctl
next: /us/knowledge/linux/crontab

---

# Supervisorctl

Index
[[TOC]]

::: tip Supervisorctl
`Supervisor` is a process management tool written in Python that allows for the seamless starting, restarting, and stopping of one or more processes. \
`Supervisorctl` serves as the command-line client for `Supervisor`.
:::

::: warning Introduction to launching multiple services with dependencies will be omitted for now.
Refer to see: [https://www.supervisord.org/](https://www.supervisord.org/)
:::

## Install

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


## Config File

::: tabs
@tab Configuration File for Supervisor
```shell:no-line-numbers
; Configuration file for supervisor

[unix_http_server]
file=/var/run/supervisor.sock   ; (the designated path to the socket file)
chmod=0700                       ; socket file permissions (default 0700)

[supervisord]
logfile=/var/log/supervisor/supervisord.log ; (primary log file; default $CWD/supervisord.log)
pidfile=/var/run/supervisord.pid ; (supervisord pid file; default supervisord.pid)
childlogdir=/var/log/supervisor            ; ('AUTO' child log directory, default $TEMP)

; The section below must be retained in the configuration file for RPC
; (supervisorctl/web interface) functionality. Additional interfaces may be
; added by defining them in distinct rpcinterface: sections
[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock ; utilize a unix:// URL for a Unix socket

; The [include] section may solely encompass the "files" setting. This
; setting can enumerate multiple files (separated by spaces or
; newlines). It can also include wildcards. The file names are
; interpreted as relative to this file. Included files *cannot*
; themselves include files.

[include]
files = /etc/supervisor/conf.d/*.conf  

```
@tab Sample Configuration
```shell:no-line-numbers
[program:app] ; Program name, used in supervisorctl to execute a series of operations on the program
autorestart=True      ; Automatically restart program upon abnormal termination
autostart=True        ; Automatically start when supervisord starts
redirect_stderr=True  ; Redirect stderr to stdout, default is false
environment=PATH="/home/app_env/bin"  ; Use environment to add necessary environment variables, a common practice is to use a specified virtualenv environment
command=python server.py  ; Startup command, same as when manually starting from the command line
user=ubuntu           ; Specifies which user to start as
directory=/home/app/  ; Directory where the program will be started
stdout_logfile_maxbytes = 20MB  ; Maximum size of stdout log file, default is 50MB
stdout_logfile_backups = 20     ; Number of backups for the stdout log file
; The stdout log file must exist, so create the directory manually if it does not exist (supervisord will auto-create the log file)
stdout_logfile = /data/logs/usercenter_stdout.log

```
@tab Hyperf Configuration File
```shell:no-line-numbers
# Create a new application and assign it a name, here set as hyperf
[program:hyperf]
# Set the command to execute within the specified directory
directory=/your/path/hyperf-v3
# Startup command for the project you wish to manage
command=php ./bin/hyperf.php start
# User under which to run the process
user=root
# Automatically start this application when supervisor starts
autostart=true
# Automatically restart the process upon termination
autorestart=true
# Time the process needs to run to be considered successfully started
startsecs=1
# Number of retries
startretries=3
# stderr log output location
stderr_logfile=/your/path/hyperf-v3/runtime/stderr.log
# stdout log output location
stdout_logfile=/your/path/hyperf-v3/runtime/stdout.log

```
:::

## Manage Supervisor

::: tip
Use `systemctl` 。[参考这里](/us/knowledge/linux/systemctl.html)
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

**Start Supervisor**

```shell:no-line-numbers
systemctl start supervisor.service
```

**Boot Startup Supervisor**

```shell:no-line-numbers
systemctl enable supervisor.service
```

## Managing Hyperf Services

::: tabs
@tab Start Hyperf
```shell:no-line-numbers
supervisorctl start hyperf
```
@tab Restart Hyperf
```shell:no-line-numbers
supervisorctl restart hyperf  
```
@tab Stop Hyperf
```shell:no-line-numbers
supervisorctl stop hyperf
```
@tab Inspect Hyperf Status
```shell:no-line-numbers
supervisorctl status hyperf
```
:::

## Common Commands

```shell:no-line-numbers
# Terminate the Supervisor itself
supervisorctl shutdown
# Initiate the Supervisor itself
supervisord -c /etc/supervisor/supervisord.conf
# Reload the Supervisor configuration and initiate
supervisorctl reload
# Commence all processes managed by supervisord
supervisorctl start all
# Halt all processes overseen by supervisord
supervisorctl stop all
# Display the status of all managed services
supervisorctl status
# View the standard output logs of a service
supervisorctl tail -f [service_name]
# Clear the output logs of a service
supervisorctl clear [service_name]
# Retrieve the process IP of a service
supervisorctl pid [service_name]
# Remove a specific service from those managed
supervisorctl remove [service_name]

```