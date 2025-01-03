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

prev: /us/hyperf/component/signal
next: /us/hyperf/component/limit
sidebarDepth: 3

---

# GuzzleHttp

Index
[[TOC]]

::: tip
Usage of the coroutine-based `GuzzleHttp` client \
For detailed usage, please refer to：[GuzzleHttp Doc](https://guzzle-cn.readthedocs.io/zh_CN/latest/overview.html)
:::

## Install Dependencies

> [Standard Library Address](https://packagist.org/packages/hyperf/guzzle)

```shell:no-line-numbers
composer require hyperf/guzzle
```

## Encapsulation Of Utility Class.

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Lib\GuzzleHttp;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use Hyperf\Guzzle\PoolHandler;
use Hyperf\Guzzle\RetryMiddleware;

use function Hyperf\Support\make;

class GuzzleFactory
{
    /**
     * 获取带有连接池的协程的guzzle客户端.
     * @explain make 从di中获取单例.
     * @see https://docs.guzzlephp.org/en/stable/
     * @param array $options 选项
     * @return Client 客户端
     */
    public static function getCoroutineGuzzleClient(array $options = []): Client
    {
        [$handler, $retry, $config] = [
            make(PoolHandler::class, ['option' => ['max_connections' => 50]]),
            make(RetryMiddleware::class, ['retries' => 1, 'delay' => 10]),
            [],
        ];
        $stack = HandlerStack::create($handler);
        $stack->push($retry->getMiddleware(), 'retry');

        $config['handler'] = $options['handler'] ?? $stack;
        $config = array_merge($config, $options);
        return make(Client::class, ['config' => $config]);
    }
}

```