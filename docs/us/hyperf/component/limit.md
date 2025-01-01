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

prev: /us/hyperf/component/guzzle
next: /us/hyperf/component/exception
sidebarDepth: 3

---

# 限流器

目录
[[TOC]]

::: tip
详情参见：[限流器](https://hyperf.wiki/3.0/#/zh-cn/rate-limit)
:::

## 安装依赖

> [标准库地址](https://packagist.org/packages/hyperf/rate-limit)

```shell:no-line-numbers
composer require hyperf/rate-limit
``` 

## 使用

```php:no-line-numbers
#[GetMapping(path: 'rate/limit')]
#[RateLimit(create: 10, consume: 5, capacity: 50)]
public function rateLimit(): array
{
    return $this->result->setData([
        'QPS' => 5,
        'CREATE TOKEN PER SECOND' => 10,
        'CAPACITY' => 50,
    ])->getResult();
}
```