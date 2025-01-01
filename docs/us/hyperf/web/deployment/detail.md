---
sidebar: [
{text: '🖼 Images', collapsible: true, children: [
{'text': 'Qrcode', link: 'hyperf/web/image/qrcode'},
{'text': 'Barcode', link: 'hyperf/web/image/barcode'},
{'text': 'Captcha', link: 'hyperf/web/image/captcha'},
]},
{text: '🔐 Locks', collapsible: true, children: [
{'text': 'Redis Lock', link: 'hyperf/web/lock/redis'},
{'text': 'Database Pessimistic Locking', link: 'hyperf/web/lock/pessimism'},
{'text': 'Database Optimistic Locking', link: 'hyperf/web/lock/optimistic'},
{'text': 'Queue(One Customer)', link: 'hyperf/web/lock/queue'},
]},
{text: '🏢 Offices', collapsible: true, children: [
{'text': 'Export Excel', link: 'hyperf/web/office/excel'},
{'text': 'Export Csv', link: 'hyperf/web/office/csv'},
]},
{text: '↔️ Encrypt', collapsible: true, children: [
{'text': 'AES', link: 'hyperf/web/convert/aes'},
{'text': 'RSA', link: 'hyperf/web/convert/rsa'},
{'text': 'AWS4', link: 'hyperf/web/convert/aws4'},
{'text': 'RC4', link: 'hyperf/web/convert/rc4'},
]},
{text: '🍪 Login', collapsible: true, children: [
{'text': 'JWT', link: 'hyperf/web/login/jwt'},
{'text': 'Cookie', link: 'hyperf/web/login/cookie'},
{'text': 'Session', link: 'hyperf/web/login/session'},
{'text': 'Q&A', link: 'hyperf/web/login/qa'},
]},
{text: '📀 Servers', collapsible: true, children: [
{'text': 'Server Notice', link: 'hyperf/web/deployment/description'},
{'text': 'Deployment Process', link: 'hyperf/web/deployment/detail'},
]},
]

prev: /us/hyperf/web/deployment/description
next: /us/hyperf/hyperf_web
sidebarDepth: 3
---

# Deployment Process

Index
[[TOC]]

::: tip
I did not use `Docker` for deployment because my personal server cannot handle it. 😅
:::

## 1、Services Used

- **Nginx**：Reverse proxy to the corresponding services (`webserver`, `webhook server`, `websocket server`, `static page`).
- **Hyperf**：WebServer and WebSocket support.
- **Hyperf-Nano**：WebHook Server (CI/CD) support.
- **Vuepress**：Documentation support (not hosted on the server).
- **OSS**：Static documentation hosting.
- **Systemctl**：System service management.
- **Supervisorctl**：Business service management.
- **Mysql**：Relational database.
- **Redis**：Cache driver, queue driver, system configuration storage.

---

## 二、Hyperf Deployment

::: tip Environment Requirements
- **Hyperf**: <Badge type="tip" text="Hyperf v3.x" vertical="middle" />
- **PHP**: <Badge type="tip" text="PHP v8.x" vertical="middle" />、<Badge type="tip" text="Swoole v5.x" vertical="middle" />、<Badge type="tip" text="Redis v5.x" vertical="middle" />

> Other PHP extensions can be loaded as needed

:::

---

### 2-1、Managing Hyperf start/stop with Supervisorctl

#### Configuration File

> /etc/supervisor/conf.d/hyperf.conf

```ini:no-line-numbers
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

#### Start/Stop Hyperf Service

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
@tab Check Hyperf Status
```shell:no-line-numbers
supervisorctl status hyperf
```
:::

---

### 2-2、Using Systemctl to Manage Nginx Start/Stop

::: warning Why not use Supervisorctl to manage Nginx ?
I believe `Nginx` is a system-level component and should be managed by `Systemctl`. Of course, you can also use `Supervisorctl` to manage all your components without much thought
:::

---


#### Nginx Configuration File
> /lib/systemd/system/nginx.service

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
# http://nginx.org/en/docs/control.html
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

#### Start/Stop Nginx Service

::: tabs
@tab Start Nginx
```shell:no-line-numbers
systemctl start nginx.service
```
@tab Restart Nginx
```shell:no-line-numbers
systemctl restart nginx.service
```
@tab Stop Nginx
```shell:no-line-numbers
systemctl stop nginx.service
```
@tab Check Nginx Status
```shell:no-line-numbers
systemctl status nginx.service
```
:::

---

### 2-3、Managing Supervisorctl start/stop with Systemctl

#### Supervisor Configuration File

> /lib/systemd/system/supervisor.service

```ini:no-line-numbers
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
```

#### Start/Stop Supervisor Service

::: tabs
@tab Start Supervisor
```shell:no-line-numbers
systemctl start supervisor.service
```
@tab Restart Supervisor
```shell:no-line-numbers
systemctl restart supervisor.service
```
@tab Stop Supervisor
```shell:no-line-numbers
systemctl stop supervisor.service
```
@tab Check Supervisor Status
```shell:no-line-numbers
systemctl status supervisor.service
```
:::

### 2-4、Reverse Proxy

#### Nginx Reverse Proxy Config

```nginx configuration:no-line-numbers
upstream hyperf {
    # Hyperf HTTP Server 的 IP 及 端口
    server 127.0.0.1:9501;
}

server {
    # 监听端口
    listen 80;
    listen 443 ssl;

    # ssl on;
    # 绑定的域名，填写您的域名
    server_name api.domain.com;

    ssl_certificate /your/path/hyperf-v3/api.domain.com.pem;
    ssl_certificate_key /your/path/hyperf-v3/api.domain.com.key;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;

    # webhook 服务
    location /webhook/ {
        # 将客户端的 Host 和 IP 信息一并转发到对应节点
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 执行代理访问真实服务器
        proxy_pass http://127.0.0.1:9601;
    }

    # 静态文档(API静态文档)
    location /swagger/ {
    	root /your/path/hyperf-v3/;
    }

    # wss服务
    location /wss/ {
    	proxy_set_header Upgrade "websocket";
	    proxy_set_header Connection "upgrade";
	    # proxy_set_header Host $host;
	    proxy_http_version 1.1;
	    proxy_pass http://127.0.0.1:9501;
    }

    # web服务
    location / {
        # 将客户端的 Host 和 IP 信息一并转发到对应节点
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # 转发Cookie，设置 SameSite
        proxy_cookie_path / "/; secure; HttpOnly; SameSite=strict";

        # 执行代理访问真实服务器
        proxy_pass http://127.0.0.1:9501;
    }
}
```

## 三、Webhook Deployment

::: tip 主要作用
When we push code to `GitHub`, it triggers the `webhook`, which requests our server's `webhook server` to pull the code and restart the service
:::

---

### 3-1、Github Webhook

![](https://img.tzf-foryou.xyz/img/20240102162447.png)

### 3-2、Hook Server

#### Directory Structure

```text:no-line-numbers
.
├── composer.json
├── composer.lock
├── stderr.log
├── stdout.log
├── vendor
└── webhook.php

1 directory, 5 files
```

#### Code

::: details webhook.php
```php:no-line-numbers
<?php

declare(strict_types=1);

require_once './vendor/autoload.php';

use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\HttpServer\Response;
use Hyperf\Nano\Factory\AppFactory;
use Hyperf\Stringable\Str;

date_default_timezone_set('Asia/Shanghai');

// ---------------------------
// | github webhook server
// ---------------------------

$app = AppFactory::create('0.0.0.0', 9601);
$key = \Hyperf\Support\env('SECRET', 'helloworld');

// github webhook
$app->post('/webhook/github', function () use ($app, $key) {
$response = new Response();
    [$githubEvent, $githubSha1, $githubSha256, $payload, $isUpdateComposer] = [
        $this->request->getHeaderLine('x-github-event'),
        $this->request->getHeaderLine('x-hub-signature'),
        $this->request->getHeaderLine('x-hub-signature-256'),
        $this->request->all(),
        false,
    ];
    // 不是PUSH动作不做处理
    if (strtolower($githubEvent) !== 'push') {
        return $response->withStatus(401)
            ->withHeader('content-type', 'application/json')
            ->withBody(new SwooleStream(json_encode([
                'code'   => 401,
                'msg'    => '非push操作',
                'status' => false,
                'data'   => []
            ], 264 | 64)));
    }

    // 签名错误
    [$signSha1, $signSha256, $githubSha1, $githubSha256] = [
        hash_hmac('sha1', json_encode($payload, 256 | 64), $key, false),
        hash_hmac('sha256', json_encode($payload, 256 | 64), $key, false),
        Str::after($githubSha1, 'sha1='),
        Str::after($githubSha256, 'sha256=')
    ];
    if ($signSha1 !== $githubSha1 || $signSha256 !== $githubSha256) {
        return $response->withStatus(401)
            ->withHeader('content-type', 'application/json')
            ->withBody(new SwooleStream(json_encode([
                'code'   => 401,
                'msg'    => '签名错误',
                'status' => false,
                'data'   => ['signSha1' => $signSha1, 'signSha256' => $signSha256]
            ], 264 | 64)));
    }

    // 变更的文件如果有composer.json 则更新依赖包
    $commits = $payload['commits'];
    foreach ($commits as $commit) {
        if (in_array('composer.json', $commit['modified'])) {
            $isUpdateComposer = true;
        }
    }

    // 执行脚本命令(异步处理)
    Hyperf\Coroutine\Coroutine::create(function () use ($isUpdateComposer) {
    	$command = $isUpdateComposer ?
            "cd /your/path/hyperf-v3 && rm -rf /your/path/hyperf-v3/runtime/container/ && git checkout . && git pull && echo yes | composer update && supervisorctl restart hyperf" :
            "cd /your/path/hyperf-v3 && rm -rf /your/path/hyperf-v3/runtime/container/ && git checkout . && git pull && supervisorctl restart hyperf";
        shell_exec($command);
    });

    return ['code' => 200, 'msg' => 'ok', 'status' => true, 'data' => []];
});

$app->run();
```
:::

### 3-3、Managing Webhook start/stop with Supervisorctl

#### Webhook Server Config

> /etc/supervisor/conf.d/webhook.conf

```ini:no-line-numbers
# 新建一个应用并设置一个名称，这里设置为 webhook
[program:webhook]
# 设置命令在指定的目录内执行
directory=/your/path/hyperf-nano-github-webhook
# 这里为您要管理的项目的启动命令
command=php webhook.php start
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
stderr_logfile=/your/path/hyperf-nano-github-webhook/stderr.log
# stdout 日志输出位置
stdout_logfile=/your/path/hyperf-nano-github-webhook/stdout.log
```

#### Start/Stop Webhook Service

::: tabs
@tab Start Webhook
```shell:no-line-numbers
supervisorctl start webhook
```
@tab Restart Webhook
```shell:no-line-numbers
supervisorctl restart webhook  
```
@tab Stop Webhook
```shell:no-line-numbers
supervisorctl stop webhook
```
@tab Check Webhook Status
```shell:no-line-numbers
supervisorctl status webhook
```
:::

## 四、Wiki Deployment

::: warning Why is the wiki not deployed on the server?
I use `OSS` to host the static files. Since `Vuepress` generates pure static files after packaging, and the `wiki` does not require backend services, hosting on `OSS` is more suitable. Releasing the server will not affect the website display.
PS: Many official websites are actually also hosted as static files."
:::

---

### 4-1、Website Hosting

::: tip The hosting details will not be elaborated here; please refer to the documentation.
:::

- [Static website hosting](https://help.aliyun.comoss/user-guide/static-website-hosting-8/)
- [Binding a custom domain](https://help.aliyun.comoss/user-guide/map-custom-domain-names-5)
- [Using the HTTPS protocol](https://help.aliyun.comoss/user-guide/host-ssl-certificates)

### 4-2、Publish Update

::: warning 
I did not use any CI/CD-related steps here because all I need to do is upload the files to the OSS bucket.
:::

---

#### Package Locally

![](https://img.tzf-foryou.xyz/img/20240102165147.png)


#### Upload to OSS

![](https://img.tzf-foryou.xyz/img/20240102165301.png)