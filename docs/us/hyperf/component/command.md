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

prev: /us/hyperf/component/log
next: /us/hyperf/component/websocket
sidebarDepth: 3

---

# Command

Index
[[TOC]]

::: tip
Here are some command-line entries I added. For usage, please refer to the documentation: [Command](https://hyperf.wiki/3.0/#/zh-cn/command)
:::

## Scheduled Task Switch

::: tip 【Note】
By changing an external variable, you can control whether to skip the consumption logic of the scheduled task. For example: the engine is running, but the gear is not engaged.
The execution process will run the task according to the rules, but the task will first check the external variable to decide whether to execute the scheduled task.

**Shell**：
```shell:no-line-numbers
php bin/hyperf crontab:switch start|stop
```
 
:::

---

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Command;

use App\Constants\ConstCode;
use Hyperf\Cache\Cache;
use Hyperf\Command\Annotation\Command;
use Hyperf\Command\Command as HyperfCommand;
use Psr\Container\ContainerInterface;
use Symfony\Component\Console\Input\InputArgument;
use Throwable;

#[Command]
class SchedulerCommand extends HyperfCommand
{
    protected const START = 'start';

    protected const STOP = 'stop';

    public function __construct(protected ContainerInterface $container)
    {
        parent::__construct('crontab:switch');
    }

    public function configure()
    {
        parent::configure();
        $this->setHelp('make scheduler running logic or not. eg: php bin/hyperf crontab:switch start');
        $this->setDescription('定时任务是否执行消费逻辑');
        $this->addArgument('action', InputArgument::REQUIRED, 'start or stop');
    }

    public function handle()
    {
        $argumentAction = $this->input->getArgument('action');
        try {
            $cache = $this->container->get(Cache::class);
            if ($argumentAction === self::STOP) {
                $cache->delete(ConstCode::SCHEDULER_IS_RUNNING_KEY);
                $this->line('定时任务已跳出执行逻辑', 'info');
            } else {
                $cache->set(ConstCode::SCHEDULER_IS_RUNNING_KEY, 'SCHEDULER-IS-NOT-RUNNING');
                $this->line('定时任务已进入执行逻辑', 'info');
            }
        } catch (Throwable $e) {
            $this->line('发生错误: ' . $e->getMessage(), 'error');
        }
    }
}

```
:::

---

## Maintenance Mode

::: tip 【Note】
By changing an external variable, you can control whether to dispatch tasks to the Redis queue.

**Shell**：
```shell:no-line-numbers
php bin/hyperf queue:switch ${QUEUE_NAME} start|stop
```
:::

---
::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Command;

use App\Lib\RedisQueue\RedisQueueFactory;
use Hyperf\Cache\Cache;
use Hyperf\Command\Annotation\Command;
use Hyperf\Command\Command as HyperfCommand;
use Hyperf\Contract\ConfigInterface;
use Psr\Container\ContainerInterface;
use Symfony\Component\Console\Input\InputArgument;
use Throwable;

/**
 * 是否允许业务向redis异步队列投递消息.
 * Class QueuePushCommand.
 */
#[Command]
class QueuePushCommand extends HyperfCommand
{
    protected const START = 'start';

    protected const STOP = 'stop';

    public function __construct(protected ContainerInterface $container)
    {
        parent::__construct('queue:switch');
    }

    public function configure()
    {
        parent::configure();
        $this->setHelp('allow or forbid push message to redis queue. eg: php bin/hyperf queue:switch redis-queue start');
        $this->setDescription('允许或禁止向指定的队列投递信息');
        $this->addArgument('queue_name', InputArgument::REQUIRED, 'redis queue name');
        $this->addArgument('action', InputArgument::OPTIONAL, 'start or stop', 'start');
    }

    public function handle()
    {
        [$argumentQueueName, $argumentAction] = [
            $this->input->getArgument('queue_name'),
            $this->input->getArgument('action'),
        ];
        try {
            [$config, $cache] = [
                $this->container->get(ConfigInterface::class),
                $this->container->get(Cache::class),
            ];
            $allRedisQueueName = array_keys($config->get('async_queue'));
            if (! in_array($argumentQueueName, $allRedisQueueName)) {
                $this->line($argumentQueueName . ' 队列未配置, 请检查', 'error');
                return null;
            }
            if (! in_array($argumentAction, ['stop', 'start'])) {
                $this->line('action 只允许 start 或 stop', 'error');
                return null;
            }

            $key = sprintf(RedisQueueFactory::IS_PUSH_KEY, $argumentQueueName);
            if ($argumentAction === self::START) {
                $cache->set($key, "{$argumentQueueName}:{$argumentAction}");
                $this->line("{$argumentQueueName} 队列已允许投递消息 !!!", 'info');
            } else {
                $cache->delete($key);
                $this->line("{$argumentQueueName} 队列已禁止投递消息 !!!", 'info');
            }
        } catch (Throwable $e) {
            $this->line('发生异常: ' . $e->getMessage(), 'error');
        }
    }
}

```
:::

---

## Maintenance Mode

::: tip
The command-line tool is used to modify the external variable, and the middleware checks whether the variable is in maintenance mode.
:::

---

### Command-Line Code

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Command;

use App\Constants\ConstCode;
use Hyperf\Cache\Cache;
use Hyperf\Command\Annotation\Command;
use Hyperf\Command\Command as HyperfCommand;
use Psr\Container\ContainerInterface;
use Symfony\Component\Console\Input\InputArgument;
use Throwable;

#[Command]
class FixModeCommand extends HyperfCommand
{
    protected const START = 'start';

    protected const STOP = 'stop';

    public function __construct(protected ContainerInterface $container)
    {
        parent::__construct('website:switch');
    }

    public function configure()
    {
        parent::configure();
        $this->setHelp('make website to fix mode. eg: php bin/hyperf website:switch start');
        $this->setDescription('网站是否进入维护模式');
        $this->addArgument('action', InputArgument::REQUIRED, 'start or stop');
    }

    public function handle()
    {
        $argumentAction = $this->input->getArgument('action');
        try {
            $cache = $this->container->get(Cache::class);
            if ($argumentAction === self::STOP) {
                $cache->set(ConstCode::FIX_MODE, 'WEBSITE-IS-IN-FIX-MODE');
                $this->line('网站已进入维护模式', 'info');
            } else {
                $cache->delete(ConstCode::FIX_MODE);
                $this->line('网站已脱离维护模式', 'info');
            }
        } catch (Throwable $e) {
            $this->line('发生错误: ' . $e->getMessage(), 'error');
        }
    }
}

```
:::

---

### Middleware Code

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Middleware;

// 进入维护模式时, 所有的请求均不可访问
use App\Constants\ConstCode;
use App\Constants\SystemCode;
use Hyperf\Cache\Cache;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\SimpleCache\InvalidArgumentException;

class MaintenanceMiddleware extends AbstractMiddleware
{
    /**
     * 是否开启维护模式.
     * @param ServerRequestInterface $request 请求类
     * @param RequestHandlerInterface $handler 处理器
     * @return ResponseInterface 响应
     * @throws ContainerExceptionInterface 异常
     * @throws NotFoundExceptionInterface 异常
     * @throws InvalidArgumentException 异常
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $cache = $this->container->get(Cache::class);
        $isFixMode = $cache->get(ConstCode::FIX_MODE, false);
        if ($isFixMode !== false) {
            return $this->buildErrorResponse(SystemCode::FIX_MODE);
        }
        return $handler->handle($request);
    }
}

```
:::