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
{text: '📡 命令行', link: '/zh/hyperf/component/command'},
{text: '🔁 WebSocket', link: '/zh/hyperf/component/websocket'},
]

prev: /zh/hyperf/component/cache
next: /zh/hyperf/component/queue/info
sidebarDepth: 3

---

# 异步队列

目录
[[TOC]]

::: tip 【说明】
- 该组件只是提供异步、延迟能力，并不支持 `ack` 应答机制。
- 角色可以分为：消息体(逻辑实现)、消费者(消费进程)、投递者(这里我单独封装了)
- 重启服务导致消费中的消息执行不完整，请参考：[安全关闭](https://hyperf.wiki/3.0/#/zh-cn/async-queue?id=%e5%ae%89%e5%85%a8%e5%85%b3%e9%97%ad)
:::

---

::: warning 【注意】

超时不意味着失败: \
1、在消费的过程中，只要是超过了配置的超时时间，该消息就会被投递至timeout队列，但是会依然执行，直到异常退出或者正常退出。\
2、如果能够保证消息的幂等性(多次调用和单次调用不会影响业务逻辑处理)，那么可以开启ReloadChannelListener监听器，该监听器会将timeout队列内的消息重新放回waiting队列，等待再次被执行。(默认不开启ReloadChannelListener监听器，即：超时任务需要自己处理) 。\
3、先超时后失败，则不会触发重试机制(已经投递至超时队列，失败队列没有消息，所以无法重试) 。\
4、先失败后超时，会触发重试机制。\
5、并不是说是个队列就可以做类似秒杀等场景，因为队列也可以同时消费多个消息。\
6、集群模式下，请一定注意不要别的消费者消费走，最好集群模式使用专业MQ。
:::

## 安装依赖

> [标准库地址](https://packagist.org/packages/hyperf/async-queue)

```shell:no-line-numbers
composer require hyperf/async-queue
```

## 配置

> config/autoload/async_queue.php

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 默认队列
    ConstCode::DEFAULT_QUEUE_NAME => [
        'driver' => Hyperf\AsyncQueue\Driver\RedisDriver::class,
        'redis' => [
            'pool' => 'default',
        ],
        'channel' => '{queue}',
        'timeout' => 2,
        'retry_seconds' => 5,
        'handle_timeout' => 10,
        'processes' => 1,
        'concurrent' => [
            'limit' => 10,
        ],
    ],
    // 自定义队列进程的队列名称
    ConstCode::NORMAL_QUEUE_NAME => [
        // 使用驱动(这里我们使用Redis作为驱动。AMQP等其他自行更换)
        'driver' => Hyperf\AsyncQueue\Driver\RedisDriver::class,
        // Redis连接信息
        'redis' => ['pool' => 'default'],
        // 队列前缀
        'channel' => 'redis-queue',
        // pop 消息的超时时间(详见：brPop)
        'timeout' => 3,
        // 消息重试间隔(秒)
        // [注意]: 真正的重试时间为: retry_seconds + timeout = 7；实验所得
        'retry_seconds' => 5,
        // 消费消息超时时间
        'handle_timeout' => 5,
        // 消费者进程数
        'processes' => 10,
        // 并行消费消息数目
        'concurrent' => [
            'limit' => 100,
        ],
        // 当前进程处理多少消息后重启消费者进程(0||不写=>不重启)
        'max_messages' => 0,
    ],
    // 并行消费为1的特殊队列
    ConstCode::LOCK_QUEUE_NAME => [
        // 使用驱动(这里我们使用Redis作为驱动。AMQP等其他自行更换)
        'driver' => Hyperf\AsyncQueue\Driver\RedisDriver::class,
        // Redis连接信息
        'redis' => [
            'pool' => 'default',
        ],
        // 队列前缀
        'channel' => 'lock-queue',
        // pop 消息的超时时间(详见：brPop)
        'timeout' => 2,
        // 消息重试间隔(秒)
        // [注意]: 真正的重试时间为: retry_seconds + timeout = 7；实验所得
        'retry_seconds' => 5,
        // 消费消息超时时间
        'handle_timeout' => 10,
        // 消费者进程数
        'processes' => 1,
        // 并行消费消息数目
        'concurrent' => [
            'limit' => 1,
        ],
    ],
];

```
:::

## 自定义消费进程

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Process\OverloadProcess;

use App\Constants\ConstCode;
use Hyperf\AsyncQueue\Process\ConsumerProcess;
use Hyperf\Process\Annotation\Process;

#[Process(
    nums: 4, // 消费者进程数
    name: 'AsyncQueueProcess', // 队列名称
    redirectStdinStdout: false, // 重定向自定义进程的标准输入和输出
    enableCoroutine: true, // 是否启用协程
)]
class AsyncQueueProcess extends ConsumerProcess
{
    // 这里的队列名称请和配置文件对应的队列名称保持一致
    protected string $queue = ConstCode::NORMAL_QUEUE_NAME;
}

```

## 定义消费体

::: danger 【注意】
- 消息体定义了消费者进程执行该任务所应该执行的逻辑。
- 下面示例的`$uniqueId`，是因为入参完全一致的情况下，投递多个会覆盖之前的消息(可以理解为Redis多次set，会覆盖对应的值)。
- 消息体应该实现对应的抽象类，而不是直接声明消息体，可以很好的约束所有消息体都符合对应的规范。
- 消息体不应该包含较大的对象实例，因为会序列化投递Redis，太大可能会失败。
:::

---

### 抽象类

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Job;

use Hyperf\AsyncQueue\Job;

/**
 * 异步消息体抽象类.
 * Class AbstractJob.
 */
abstract class AbstractJob extends Job
{
    /**
     * 最大尝试次数(max = $maxAttempts+1).
     * @var int 整型
     */
    public int $maxAttempts = 2;

    /**
     * 任务编号(传递编号相同任务会被覆盖!).
     * @var string ''
     */
    public string $uniqueId;

    /**
     * 消息参数.
     * @var array 关联数组
     */
    public array $params;

    public function __construct(string $uniqueId, array $params)
    {
        [$this->uniqueId, $this->params] = [$uniqueId, $params];
    }

    public function handle() {}
}

```

### 实体类示例

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Job;
use App\Lib\Log\Log;
use Hyperf\Coroutine\Coroutine;

class DemoJob extends AbstractJob
{
    public function __construct(string $uniqueId, array $params)
    {
        parent::__construct($uniqueId, $params);
    }

    // 模拟消息体消费超时
    public function handle()
    {
        // 模拟任务耗时3秒
        // 当配置中的 handle_timeout = 3 时，可以看到我们的消息体需要执行4秒，所以该消息一定会超时，
        // 被放入timeout队列，但是看控制台可以看到开始、进行中、结束，所以：超时不一定是失败！！！
        Coroutine::sleep(1);
        Log::stdout()->info("任务ID:{$this->uniqueId}--开始");
        Coroutine::sleep(2);
        Log::stdout()->info("任务ID:{$this->uniqueId}--进行中");
        Coroutine::sleep(1);
        Log::stdout()->info("任务ID:{$this->uniqueId}--结束");
    }
}

```

## 封装投递类

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\RedisQueue;

use App\Job\AbstractJob;
use Hyperf\AsyncQueue\Driver\DriverFactory;
use Hyperf\AsyncQueue\Driver\DriverInterface;
use Hyperf\Cache\Cache;
use Hyperf\Context\ApplicationContext;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\SimpleCache\InvalidArgumentException;

class RedisQueueFactory
{
    /**
     * 根据队列名称判断是否投递消息.
     */
    public const IS_PUSH_KEY = 'IS_PUSH_%s';

    /**
     * 获取队列实例(后续准备废弃, 请使用safePush投递).
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function getQueueInstance(string $queueName = 'default'): DriverInterface
    {
        return ApplicationContext::getContainer()->get(DriverFactory::class)->get($queueName);
    }

    /**
     * 根据外部变量控制是否投递消息.
     * @return mixed 是否投递成功
     * @throws InvalidArgumentException|NotFoundExceptionInterface 异常
     * @throws ContainerExceptionInterface 异常
     */
    public static function safePush(AbstractJob $job, string $queueName = 'default', int $delay = 0): bool
    {
        // 动态读取外部变量, 判断是否投递
        $key = sprintf(static::IS_PUSH_KEY, $queueName);
        $isPush = ApplicationContext::getContainer()->get(Cache::class)->get($key);
        if ($isPush !== false) {
            $queueInstance = ApplicationContext::getContainer()->get(DriverFactory::class)->get($queueName);
            return $queueInstance->push($job, $delay);
        }
        return false;
    }
}

```

## 自定义监听器

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Listener;

use App\Lib\Log\Log;
use Hyperf\AsyncQueue\AnnotationJob;
use Hyperf\AsyncQueue\Event\AfterHandle;
use Hyperf\AsyncQueue\Event\BeforeHandle;
use Hyperf\AsyncQueue\Event\Event;
use Hyperf\AsyncQueue\Event\FailedHandle;
use Hyperf\AsyncQueue\Event\QueueLength;
use Hyperf\AsyncQueue\Event\RetryHandle;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
class QueueHandleListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            // 队列长度信息事件 (系统底层有监听器, 这里不再二次处理)
            // QueueLength::class,
            // 消息消费后事件
            AfterHandle::class,
            // 消息消费前事件
            BeforeHandle::class,
            // 消息消费失败事件
            FailedHandle::class,
            // 消息重试事件
            RetryHandle::class,
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof Event && $event->getMessage()->job()) {
            $job = $event->getMessage()->job();
            $jobClass = get_class($job);
            if ($job instanceof AnnotationJob) {
                $jobClass = sprintf('Job[%s@%s]', $job->class, $job->method);
            }
            $date = date('Y-m-d H:i:s');

            switch (true) {
                case $event instanceof BeforeHandle:
                    Log::stdout()->info(sprintf('[%s] Processing %s.', $date, $jobClass));
                    break;
                case $event instanceof AfterHandle:
                    Log::stdout()->info(sprintf('[%s] Processed %s.', $date, $jobClass));
                    break;
                case $event instanceof FailedHandle:
                    Log::error(sprintf('[%s] Failed %s.', $date, $jobClass));
                    Log::error((string) $event->getThrowable());
                    break;
                case $event instanceof RetryHandle:
                    Log::warning(sprintf('[%s] Retried %s.', $date, $jobClass));
                    break;
                default:
                    Log::warning('未知事件');
            }
        }
    }
}

```

## 调用示例

> 这里示例的是在另一个自定义进程中向队列中投递，当然常见的是 `HttpServer` 中。

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Process;

use App\Exception\BusinessException;
use App\Job\DemoJob;
use App\Lib\Log\Log;
use App\Lib\RedisQueue\RedisQueueFactory;
use Hyperf\Coroutine\Coroutine;
use Hyperf\Process\AbstractProcess;
use Hyperf\Process\Annotation\Process;
use Hyperf\Process\ProcessManager;
use Throwable;

#[Process(
    nums: 1, // 进程数目
    name: 'PushMsgDemoProcess',
    redirectStdinStdout: false,
    pipeType: 2,
    enableCoroutine: true // 进程内是否启用协程
)]
class PushMsgDemoProcess extends AbstractProcess
{
    public function handle(): void
    {
        try {
            while (ProcessManager::isRunning()) {
                Coroutine::sleep(10);
                $queueInstance = RedisQueueFactory::getQueueInstance('limit-queue');
                $isPushOk = $queueInstance->push(new DemoJob((string) Coroutine::id(), []));
                if (! $isPushOk) {
                    throw new BusinessException();
                }
            }
        } catch (Throwable $e) {
            Log::stdout()->error("ConsumerProcess 异常被捕获: {$e->getMessage()}");
        } finally {
            Log::stdout()->warning('ConsumerProcess 进程将被拉起 !!!');
        }
    }

    // 是否随着服务一起启动
    public function isEnable($server): bool
    {
        return \Hyperf\Support\env('APP_ENV', 'dev') === 'pro';
    }
}

```