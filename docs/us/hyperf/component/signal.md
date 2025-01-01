---
sidebar: [
{text: '📞 Event Mechanism', collapsible: true, children: [
{text: 'Event Roles and Considerations', link: 'hyperf/component/event/event'},
{text: 'Code Example', link: 'hyperf/component/event/code'},
]},
{text: '⏰ Crontab', link: 'hyperf/component/crontab'},
{text: '⛓ Processes', link: 'hyperf/component/process'},
{text: '📝 File System', link: 'hyperf/component/filesystem'},
{text: '🕓 Cache', link: 'hyperf/component/cache'},
{text: '📩 Queue', collapsible: true, children: [
{text: 'Queue Usage', link: 'hyperf/component/queue/overview'},
{text: 'Notes', link: 'hyperf/component/queue/info'},
]},
{text: '🚦 Signal', link: 'hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: 'hyperf/component/guzzle'},
{text: '📉 Rate Limiter', link: 'hyperf/component/limit'},
{text: '❌ Exception', link: 'hyperf/component/exception'},
{text: '🖨 Logs', link: 'hyperf/component/log'},
{text: '📡 Command', link: 'hyperf/component/command'},
{text: '🔁 WebSocket', link: 'hyperf/component/websocket'},
]

prev: /us/hyperf/component/queue/info
next: /us/hyperf/component/guzzle
sidebarDepth: 3

---

# Signal

Index
[[TOC]]

## Install Dependencies

[Standard Library Address](https://packagist.org/packages/hyperf/signal)

```php:no-line-numbers
composer require hyperf/signal
```

## Publish Config

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

## Register Signal Handler

### Custom Process Signal Handler

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

### Custom Work Process Signal Handler

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