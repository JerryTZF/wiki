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

prev: /us/hyperf/component/queue/overview
next: /us/hyperf/component/signal
sidebarDepth: 3

---

# Queue Notes

Index
[[TOC]]

::: tip
For any message, we need to consider:
- Whether it will timeout (exceeding the configured consumption time).
- How we should handle exceptions during the consumption process.
- Whether the message is idempotent, i.e., multiple executions do not affect business logic.
- How to handle messages that were being processed when the service stops without triggering an exception.。[Safe Shutdown](https://hyperf.wiki/3.0/#/zh-cn/async-queue?id=%e5%ae%89%e5%85%a8%e5%85%b3%e9%97%ad)

Essentially, this means shutting down the consumer process after a specified time, but it cannot guarantee 100% safety. However, the restart commands of `K8S` or `Docker` will ensure a better guarantee. (This conclusion was drawn from testing...)
:::

---

## Consumption Timeout

1. For services with heavy computations or time-consuming operations, we should try to create new queues and configure longer timeout durations to distinguish them from regular queues.
2. Timeout tasks will be placed in the `timeout` queue, but they have already been triggered, i.e., <font color="red">**they are still executing despite the timeout**</font>.
3. For idempotent tasks, we can configure the `ReloadChannelListener` listener, which will move messages in the `timeout queue` back to the `waiting queue` for continued consumption.

## Consumption Exception

1. When an exception occurs during consumption, the task will immediately retry until the maximum retry limit is reached.
2. **Please ensure `transaction consistency`! Otherwise, retries may lead to unexpected issues, such as operations being skipped or using pessimistic locks.**
3. If `transaction consistency` cannot be guaranteed, the task can be marked as failed within the `try-catch-finally` block (ensure that the consumption "appears successful" for this round), and it will be reprocessed later.

## Idempotency

Please try to ensure that tasks are idempotent. Most tasks are `update` operations, so you can implement a <font color="red"> **resumable mode**</font> where you re-check whether a write operation is needed. 
If the content has already been processed, skip that operation when it is executed again.


## Service Stop Issues

> When the service stops, the underlying system will close the consumption process after a specified time. However, if a large number of messages are still being delivered for consumption, it is possible that tasks being processed may be forcibly terminated in the middle of execution without triggering an exception.

### Solution 1

1. Before delivering the message, check external variables to decide whether to deliver it, in order to control the queue traffic. (You can create a new command for CLI operation) Reference: [Queue Delivery Switch](/us/hyperf/component/command.html).
2. Increase the `waiting time` value to allow existing tasks to be processed as much as possible. In `swoole`, the
[waiting time](https://wiki.swoole.com/#/server/setting?id=max_wait_time)，`Hyperf`
[waiting time](https://hyperf.wiki/3.0/#/zh-cn/signal)

**Code Exp**

> [封装投递类](/us/hyperf/component/queue/overview.html#custom-consumption-process)

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\RedisQueue;

use App\Job\AbstractJob;
use App\Lib\Redis\Redis;
use Hyperf\AsyncQueue\Driver\DriverFactory;
use Hyperf\AsyncQueue\Driver\DriverInterface;
use Hyperf\Context\ApplicationContext;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

class RedisQueueFactory
{
    /**
     * 根据队列名称判断是否投递消息.
     */
    private const IS_PUSH_KEY = 'IS_PUSH_%s';

    /**
     * 获取队列实例.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function getQueueInstance(string $queueName = 'default'): DriverInterface
    {
        return ApplicationContext::getContainer()->get(DriverFactory::class)->get($queueName);
    }

    /**
     * 根据外部变量控制是否投递消息.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function safePush(AbstractJob $job, string $queueName = 'default', int $delay = 0): bool
    {
        // 动态读取外部变量, 判断是否投递
        $key = sprintf(static::IS_PUSH_KEY, $queueName);
        $isPush = Redis::getRedisInstance()->get($key);
        if ($isPush) {
            return self::getQueueInstance($queueName)->push($job, $delay);
        }
        return false;
    }
}

```
---

> Code Example

```php:no-line-numbers
#[GetMapping(path: 'queue/safe_push')]
public function safePushMessage(): array
{
    for ($i = 10; --$i;) {
        Coroutine::create(function () use ($i) {
            $job = new DemoJob((string) $i, []);
            RedisQueueFactory::safePush($job, 'redis-queue', 0);
        });
    }

    return $this->result->getResult();
}
```

---

### Solution 2

The outermost gateway layer performs traffic switching, 
for example: `Gateway`, `ServerA`, `ServerB`. 
When `ServerA` needs to be restarted, all traffic is redirected to `ServerB`.
After the restart is complete, all traffic is redirected back to `ServerA`, 
and at this point, `ServerB` can restart. This solution relies on gateway capabilities.