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

prev: /us/hyperf/component/cache
next: /us/hyperf/component/queue/info
sidebarDepth: 3

---

# Queue Usage

Index
[[TOC]]

::: tip 【Note】
- This component only provides asynchronous and delayed capabilities and does not support the `ack` acknowledgment mechanism.
- Roles can be divided into: message body (logic implementation), consumer (consumption process), and deliverer (which I have encapsulated separately).
- Restarting the service may cause incomplete execution of messages in progress. Please refer to: [Safe Shutdown](https://hyperf.wiki/3.0/#/zh-cn/async-queue?id=%e5%ae%89%e5%85%a8%e5%85%b3%e9%97%ad)
:::

---

::: warning 【Warning】

Timeout does not mean failure:: 
1. During consumption, if the message exceeds the configured timeout, it will be delivered to the timeout queue. However, it will continue to execute until it either exits with an exception or completes normally. 
2. If you can ensure the idempotency of the message (i.e., multiple executions and single executions will not affect the business logic processing), you can enable the `ReloadChannelListener` listener. This listener will move the messages in the timeout queue back to the waiting queue to be executed again. (By default, the `ReloadChannelListener` listener is not enabled, meaning that timeout tasks need to be handled manually). 
3. If the message times out first and then fails, the retry mechanism will not be triggered (as it has already been delivered to the timeout queue and there are no messages in the failure queue, so no retry can occur). 
4. If the message fails first and then times out, the retry mechanism will be triggered. 
5. Just because it's a queue doesn't mean it can be used for scenarios like flash sales, as the queue can consume multiple messages simultaneously.
6 .In cluster mode, please ensure that other consumers do not consume the message. It is best to use a professional MQ for clustered environments.
:::

## Install Dependencies

> [Standard Library Address](https://packagist.org/packages/hyperf/async-queue)

```shell:no-line-numbers
composer require hyperf/async-queue
```

## Configuration

> config/autoload/async_queue.php

::: details Detail
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

## Custom Consumption Process

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

## Define Consumer Body

::: danger 【Note】
- The message body defines the logic that the consumer process should execute for the task.
- The `$uniqueId` in the following example is used because if the input parameters are identical, multiple deliveries will overwrite the previous messages (similar to how Redis overwrites values with multiple `set` commands).
- The message body should implement the corresponding abstract class, rather than being declared directly, which helps ensure that all message bodies adhere to the relevant specifications.
- The message body should not include large object instances, as they will be serialized and delivered to Redis. Large objects may cause failures.
:::

---

### Abstract Class

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

### Entity Class Example

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

## Encapsulated Dispatch Class Example

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

## Custom Listener Example

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

## Usage

> The example here demonstrates delivering a message to the queue within another custom process, but it is more common in `HttpServer`.

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