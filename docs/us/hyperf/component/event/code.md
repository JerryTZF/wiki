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

prev: /us/hyperf/component/event/event
next: /us/hyperf/component/crontab

sidebarDepth: 3

---

# Event Code Example

Index
[[TOC]]

## Install Dependencies (default is already installed)

```shell:no-line-numbers
composer require hyperf/event
```

## Slow SQL Listener

:::details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Listener;

use App\Lib\Log\Log;
use Hyperf\Collection\Arr;
use Hyperf\Database\Events\QueryExecuted;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
class DbQueryExecutedListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            QueryExecuted::class, // 系统事件, 底层有相应的触发器触发
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof QueryExecuted) {
            $sql = $event->sql;
            if (! Arr::isAssoc($event->bindings)) {
                $position = 0;
                foreach ($event->bindings as $value) {
                    $position = strpos($sql, '?', $position);
                    if ($position === false) {
                        break;
                    }
                    $value = "'{$value}'";
                    $sql = substr_replace($sql, $value, $position, 1);
                    $position += strlen($value);
                }
            }

            // 大于2000毫秒记录日志
            if ($event->time > 2000) {
                $logMessage = sprintf('[%s毫秒] %s', $event->time, $sql);
                Log::warning($logMessage);
            }
        }
    }
}

```
:::

## Redis Asynchronous Queue Listener

::: details Detail
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
use Hyperf\AsyncQueue\Event\RetryHandle;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

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

    /**
     * 队列监听器逻辑.
     * @param object $event 消息体
     * @throws ContainerExceptionInterface 异常
     * @throws NotFoundExceptionInterface 异常
     */
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
                    Log::stdout()->info(sprintf('[%s] %s 正在消费.', $date, $jobClass));
                    break;
                case $event instanceof AfterHandle:
                    Log::stdout()->info(sprintf('[%s] %s 消费完成.', $date, $jobClass));
                    break;
                case $event instanceof FailedHandle:
                    $msg = sprintf('[%s] %s 消费失败. 异常信息: %s', $date, $jobClass, $event->getMessage());
                    Log::stdout()->error($msg);
                    Log::error($msg);
                    break;
                case $event instanceof RetryHandle:
                    $msg = sprintf('[%s] %s 正在重试.', $date, $jobClass);
                    Log::stdout()->warning($msg);
                    Log::warning($msg);
                    break;
                default:
                    Log::warning('未知事件');
            }
        }
    }
}

```
:::

Queue Length Information Listener Registration

> config/autoload/listeners.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    ...
    // 队列长度信息监听器
    Hyperf\AsyncQueue\Listener\QueueLengthListener::class,
    ...
];

```

## Scheduled Task Exception Listener

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Listener;

use App\Lib\Log\Log;
use Hyperf\Crontab\Event\FailToExecute;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
class SchedulerErrorListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            FailToExecute::class, // 系统事件, 底层有相应的触发器触发(抛出异常会触发该事件)
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof FailToExecute) {
            $info = sprintf('任务:%s; 错误:%s', $event->crontab->getName(), $event->throwable->getMessage());
            Log::error($info);
        }
    }
}

```
:::

## Custom Process Exception Listener

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Listener;

use App\Lib\Log\Log;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Process\Event\AfterProcessHandle;
use Hyperf\Process\Event\BeforeProcessHandle;

#[Listener]
class ConsumerProcessListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            AfterProcessHandle::class, // 系统事件(进程退出时触发)
            BeforeProcessHandle::class, // 系统事件(进程创建时触发)
        ];
    }

    public function process(object $event): void
    {
        switch (true) {
            case $event instanceof AfterProcessHandle:
                Log::stdout()->warning(sprintf('[自定义进程停止][进程:%s][第 %s 个进程]', $event->process->name, $event->index));
                break;
            case $event instanceof BeforeProcessHandle:
                Log::stdout()->info(sprintf('[自定义进程启动][进程:%s][第 %s 个进程]', $event->process->name, $event->index));
                break;
            default:
                Log::warning('未知事件');
        }
    }
}

```
:::

## Custom Validation Rule Listener

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Listener;

use Hyperf\Collection\Arr;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Validation\Contract\ValidatorFactoryInterface;
use Hyperf\Validation\Event\ValidatorFactoryResolved;

// 自定义验证器规则监听器注册
#[Listener]
class ValidatorFactoryResolvedListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            ValidatorFactoryResolved::class,
        ];
    }

    public function process(object $event): void
    {
        /** @var ValidatorFactoryInterface $factory */
        $factory = $event->validatorFactory;
        // 注册手机号验证规则
        $factory->extend('phone', function ($attr, $value, $parameters, $validator) {
            return (bool) preg_match('/^1[234578]\\d{9}$/', (string) $value);
        });
        // 非关联数组验证规则
        $factory->extend('array_list', function ($attr, $value, $parameters, $validator) {
            return ! Arr::isAssoc($value);
        });

        // 错误信息占位符
        $factory->replacer('phone', function ($message, $attr, $rule, $parameters) {
            return str_replace(':phone', $attr, $message);
        });
        $factory->replacer('array_list', function ($message, $attr, $rule, $parameters) {
            return str_replace(':array_list', $attr, $message);
        });
    }
}

```
:::

---

## System-level Listener

::: tip 【Guideline】
Generally, system-level (or underlying) listeners are registered in the configuration. Unless you intend to override them, you should register them directly in the configuration rather than using annotations.
:::

> config/autoload/listeners.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 框架提供了 error_reporting() 错误级别的监听器
    Hyperf\ExceptionHandler\Listener\ErrorExceptionHandler::class,
    // 命令行执行异常监听器
    Hyperf\Command\Listener\FailToHandleListener::class,
    // 队列长度信息监听器
    Hyperf\AsyncQueue\Listener\QueueLengthListener::class,
];

```