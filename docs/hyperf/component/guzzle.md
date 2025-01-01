---
sidebar: [
{text: '📞 事件机制', collapsible: true, children: [
{text: '事件角色和注意事项', link: 'hyperf/component/event/event'},
{text: '代码示例', link: 'hyperf/component/event/code'},
]},
{text: '⏰ 定时任务', link: 'hyperf/component/crontab'},
{text: '⛓ 自定义进程', link: 'hyperf/component/process'},
{text: '📝 文件系统', link: 'hyperf/component/filesystem'},
{text: '🕓 缓存系统', link: 'hyperf/component/cache'},
{text: '📩 异步队列', collapsible: true, children: [
{text: '队列使用', link: 'hyperf/component/queue/overview'},
{text: '注意事项', link: 'hyperf/component/queue/info'},
]},
{text: '🚦 信号处理器', link: 'hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: 'hyperf/component/guzzle'},
{text: '📉 限流器', link: 'hyperf/component/limit'},
{text: '❌ 异常处理器', link: 'hyperf/component/exception'},
{text: '🖨 日志', link: 'hyperf/component/log'},
{text: '📡 命令行', link: 'hyperf/component/command'},
{text: '🔁 WebSocket', link: 'hyperf/component/websocket'},
]

prev: /hyperf/component/signal
next: /hyperf/component/limit
sidebarDepth: 3

---

# GuzzleHttp

目录
[[TOC]]

::: tip
基于协程的 `GuzzleHttp` 客户端的使用。 \
使用详情请阅：[GuzzleHttp文档](https://guzzle-cn.readthedocs.io/zh_CN/latest/overview.html)
:::

## 安装依赖

> [标准库地址](https://packagist.org/packages/hyperf/guzzle)

```shell:no-line-numbers
composer require hyperf/guzzle
```

## 封装工具类

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