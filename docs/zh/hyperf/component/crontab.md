---
sidebar: [
{text: '📞 事件机制', collapsible: true, children: [
{text: '事件角色和注意事项', link: '/zh/hyperf/component/event/event'},
{text: '代码示例', link: '/zh/hyperf/component/event/code'},
]},
{text: '⏰ 定时任务', link: '/zh/hyperf/component/crontab'},
{text: '⛓ 自定义进程', link: '/zh/hyperf/component/process'},
{text: '📝 文件系统', link: '/zh/hyperf/component/filesystem'},
{text: '🕓 缓存系统', link: '/zh/hyperf/component/cache'},
{text: '📩 异步队列', link: '/zh/hyperf/component/queue'},
{text: '📻 信号处理器', link: '/zh/hyperf/component/signal'},
{text: '📤 http', link: '/zh/hyperf/component/guzzle'},
{text: '📉 限流器', link: '/zh/hyperf/component/limit'},
{text: '📮 异步Task', link: '/zh/hyperf/component/task'},
{text: '❌ 异常处理器', link: '/zh/hyperf/component/exception'},
]

prev: /zh/hyperf/component/event/code
next: /zh/hyperf/component/process
sidebarDepth: 3

---

# 定时任务

目录
[[TOC]]

::: tip

- `Hyperf` 定时任务本质上是 `Swoole` 拉起的一个进程，并且随着 `Hyperf` 服务启动而启动(可以配置)。
- 集群模式下请保证不会重复执行，一般情况下，集群模式，定时任务或消息队列会统一管理。 :smile:
- 这里采用 `多进程` 模式，协程模式暂未使用，暂不总结。
:::

## 安装依赖

```php:no-line-numbers
composer require hyperf/crontab
```

## 注册执行进程

> config/autoload/processes.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 定时任务调度器进程
    Hyperf\Crontab\Process\CrontabDispatcherProcess::class,
];
```

## 开启随服务启动

> config/autoload/crontab.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 是否开启定时任务
    'enable' => true,
];
```