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
{text: '📤 http', link: '/zh/hyperf/component/guzzle'},
{text: '📉 限流器', link: '/zh/hyperf/component/limit'},
{text: '📮 异步Task', link: '/zh/hyperf/component/task'},
{text: '❌ 异常处理器', link: '/zh/hyperf/component/exception'},
{text: '🖨 日志', link: '/zh/hyperf/component/log'},
]

prev: /zh/hyperf/component/queue/overview
next: /zh/hyperf/component/signal
sidebarDepth: 3

---

# 队列注意事项

目录
[[TOC]]

::: tip
任何消息我们均需要考虑：
- 是否会超时(超过配置的消费时间)。
- 消费过程中的异常我们应如何处理。
- 消息是否是幂等性的。即多次执行不影响业务逻辑。
- 当服务停止时，执行到中途的消息停掉，没有触发异常如何处理。[安全关闭](https://hyperf.wiki/3.0/#/zh-cn/async-queue?id=%e5%ae%89%e5%85%a8%e5%85%b3%e9%97%ad)
本质上是是指定时间后关闭该消费进程，但是并不能很好保证100%安全。但是 `K8S`、`Docker` 的重启命令会很好的保证。(测试得出的结论..)
:::

---

## 消费超时

1、对于大量的计算服务或者耗时操作，我们应该尽量创建新的队列，且配置较长的超时时间，以便和普通的队列进行区分。\
2、超时的任务会被放置 `timeout` 队列中，但是此时它已经被触发，即：超时了，但是依旧在执行。\
3、对于是幂等性的任务，我们可以配置 `ReloadChannelListener` 监听器，它会将 `timeout` 中的消息放置 `waiting` 队列，继续消费。

## 消费异常

1、当消费过程中出现异常抛出，任务会立即进行重试，直至达到最大重试上限。\
2、请保证 `事务一致性` ！否则重试会与之前的执行产生意想不到的问题。例如：执行过的操作再次操作跳过，或者使用使用悲观锁。\
3、如果无法保证 `事务一致性`，那么，可以在 `try-catch-finally` 中将该任务标记为失败(先保证该次消费"表面成功")，后续再次处理。

## 幂等性

1、请尽可能的保证任务是幂等性的。一般任务多为 `update` 操作，那么可以实现像 ***断点续传*** 的模式，每次都重新判断是否需要写操作，已经操作过的
内容，再次执行时跳过该步操作。

## 服务停止问题

> 当服务停止时，底层会在指定的时间后进行关闭消费进程，但是持续大量的还有消息投递进来消费，那么总有可能出现，消费过程中
> 有任务执行到中途被强制杀掉，且不会触发异常抛出。

### 方案一

1、投递消息前，先根据外部变量判断是否投递，用于控制队列流量。(可以通过创建新的命令行进行cli操作)\
2、加大 `等待时间` 的值，让存量任务尽可能的消费完。`swoole` 中的
[等待时间](https://wiki.swoole.com/#/server/setting?id=max_wait_time)，`Hyperf` 中的
[等待时间](https://hyperf.wiki/3.0/#/zh-cn/signal)

**代码示例**

> 优化 [封装投递类](/zh/hyperf/component/queue/overview.html#%E5%B0%81%E8%A3%85%E6%8A%95%E9%80%92%E7%B1%BB)

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

> 使用示例

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

### 方案二

1、最外层的网关层进行流量转换，例如：`Gateway`、`ServerA`、`ServerB`。当 `ServerA` 需要重启时，流量全量导入 `ServerB`，重启完毕后，
流量全量导入 `ServerA`，此时，`ServerB` 重启。依赖网关能力。