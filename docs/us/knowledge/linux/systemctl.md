---
sidebar: [
{text: '🔧 Package Management', link: 'knowledge/linux/package'},
{text: '🌈 Common Commands', link: 'knowledge/linux/command'},
{text: '🖌 Vim Editor', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /us/knowledge/linux/vim
next: /us/knowledge/linux/supervisorctl

---

# Systemctl

Index
[[TOC]]

::: tip Systemctl is a tool for systemd, primarily responsible for managing the system and service manager of systemd.
:::

---

## Configuration Files

::: tip Unit
Systemd introduces a core configuration concept: Unit configuration. In essence, every process managed by Systemd is a Unit, akin to a task block. There are 12 types:

- Service unit: System services
- Target unit: A group of multiple Units
- Device Unit: Hardware devices
- Mount Unit: Mount points for file systems
- Automount Unit: Automatically mounted points
- Path Unit: Files or paths
- Scope Unit: External processes not started by Systemd
- Slice Unit: Process groups
- Snapshot Unit: Systemd snapshots, allowing a return to a specific snapshot
- Socket Unit: Sockets for inter-process communication
- Swap Unit: Swap files
- Timer Unit: Timers

---

【Note】
The suffixes of different configuration files correspond to different `Units`. Here, I will exemplify using `Service`.
:::

### Configuration File Paths

```shell:no-line-numbers
# Path for standard service configuration files
/usr/lib/systemd/system/
# Service scripts generated during the system's execution, which take precedence over the above
/run/systemd/system/
# Execution scripts established by the administrator based on the host system's requirements, holding a higher priority than the aforementioned
/etc/systemd/system/

```

### Configuration File Explanation


```text:no-line-numbers
Unit
  Description: A description of the service.
  Documentation: An introduction to the documentation.
  After: Specifies which service must be started before this service. For example, MySQL should start after both the network and syslog services.

Install
  WantedBy: Represents one or more targets. When the current unit is activated (enabled), a symbolic link will be created in the /etc/systemd/system directory within a subdirectory named after the target with a .wants suffix.
  RequiredBy: Comprises one or more targets. When the current unit is activated (enabled), a symbolic link will be placed in the /etc/systemd/system directory within a subdirectory named after the target with a .required suffix.
  Alias: An alias that can be used to start the current unit.
  Also: Other units that will be activated concurrently when the current unit is enabled.

Service
  Type: Defines the behavior of the process upon start-up. The available values include:
  Type=simple: The default value, which executes the command specified in ExecStart to initiate the main process.
  Type=forking: Creates a child process from the parent using the forking method, after which the parent process exits immediately.
  Type=oneshot: A one-time process where Systemd waits for the current service to exit before continuing execution.
  Type=dbus: The current service is initiated through D-Bus.
  Type=notify: Upon successful initialization, the current service notifies Systemd before proceeding.
  Type=idle: The current service will only run after all other tasks have completed.
  ExecStart: The command to start the current service.
  ExecStartPre: The command executed prior to starting the current service.
  ExecStartPost: The command executed following the initiation of the current service.
  ExecReload: The command executed when restarting the current service.
  ExecStop: The command executed when stopping the current service.
  ExecStopPost: The command executed after stopping the service.
  RestartSec: The interval in seconds between automatic restarts of the current service.
  Restart: Determines the conditions under which Systemd will automatically restart the current service, with possible values including always, on-success, on-failure, on-abnormal, on-abort, on-watchdog.
  TimeoutSec: The number of seconds that Systemd will wait before stopping the current service.
  Environment: Specifies the environment variables.

```

### Nginx Config

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

## Common Commands

```shell:no-line-numbers
# Initiate the immediate start of a service
systemctl start nginx.service

# Immediately stop a service
systemctl stop nginx.service

# Restart a service
systemctl restart nginx.service

# Terminate all child processes of a service
systemctl kill nginx.service

# Reload the configuration file of a service
systemctl reload nginx.service

# Reload all modified configuration files
systemctl daemon-reload

# Display all underlying parameters of a specific Unit
systemctl show nginx.service

# Display the value of a specific property of a particular Unit
systemctl show -p CPUShares nginx.service

# Set a specific property for a Unit
systemctl set-property nginx.service CPUShares=500

# Enable automatic startup on boot
systemctl enable nginx.service

# Disable automatic startup on boot
systemctl disable nginx.service

# Check the status of a service
systemctl status nginx.service

# View the contents of the configuration file
systemctl cat ningx.service

```