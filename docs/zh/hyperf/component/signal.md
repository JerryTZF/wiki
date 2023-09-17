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
{text: '📩 异步队列', collapsible: true, children: [
{text: '队列使用', link: '/zh/hyperf/component/queue/overview'},
{text: '注意事项', link: '/zh/hyperf/component/queue/info'},
]},
{text: '🚦 信号处理器', link: '/zh/hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: '/zh/hyperf/component/guzzle'},
{text: '📉 限流器', link: '/zh/hyperf/component/limit'},
{text: '❌ 异常处理器', link: '/zh/hyperf/component/exception'},
{text: '🖨 日志', link: '/zh/hyperf/component/log'},
]

prev: /zh/hyperf/component/queue/info
next: /zh/hyperf/component/guzzle
sidebarDepth: 3

---

# 信号处理器

目录
[[TOC]]

## 安装依赖

[标准库地址](https://packagist.org/packages/hyperf/signal)

```php:no-line-numbers
composer require hyperf/signal
```

## 发布配置

> config/autoload/signal.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handlers' => [
        // 这里我们自己实现, 所以注释
        // Hyperf\Signal\Handler\WorkerStopHandler::class => PHP_INT_MIN,
    ],
    // 收到信号后等待时间
    'timeout' => 5.0,
];

```

## 注册信号处理器

### 自定义进程信号处理器

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Signal;

use Hyperf\Process\ProcessManager;
use Hyperf\Signal\Annotation\Signal;
use Hyperf\Signal\SignalHandlerInterface;

#[Signal]
class ProcessStopHandler implements SignalHandlerInterface
{
    public function listen(): array
    {
        return [
            [self::PROCESS, SIGTERM],
        ];
    }

    public function handle(int $signal): void
    {
        ProcessManager::setRunning(false);
    }
}
```

### 自定义work进程信号处理器

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Signal;

use Hyperf\Contract\ConfigInterface;
use Hyperf\Coroutine\Coroutine;
use Hyperf\Signal\Annotation\Signal;
use Hyperf\Signal\SignalHandlerInterface;
use Psr\Container\ContainerInterface;
use Swoole\Server;

#[Signal]
class WorkerStopHandler implements SignalHandlerInterface
{
    protected ConfigInterface $config;

    public function __construct(protected ContainerInterface $container)
    {
        $this->config = $container->get(ConfigInterface::class);
    }

    public function listen(): array
    {
        return [
            [self::WORKER, SIGTERM],
            [self::WORKER, SIGINT],
        ];
    }

    public function handle(int $signal): void
    {
        if ($signal !== SIGINT) {
            $time = $this->config->get('server.settings.max_wait_time', 3);
            Coroutine::sleep($time);
        }

        // shutdown => https://wiki.swoole.com/#/server/methods?id=shutdown 直接kill -15 不触发后续动作
        // stop => https://wiki.swoole.com/#/server/methods?id=stop 使当前 Worker 进程停止运行，并立即触发 onWorkerStop 回调函数。

        //  $this->container->get(Server::class)->shutdown();
        $this->container->get(Server::class)->stop(-1, false);
    }
}

```