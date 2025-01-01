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

prev: /hyperf/component/guzzle
next: /hyperf/component/exception
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