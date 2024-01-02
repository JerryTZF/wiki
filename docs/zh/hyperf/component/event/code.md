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

prev: /zh/hyperf/hyperf_component
next: /zh/hyperf/component/crontab

sidebarDepth: 3

---

# 事件代码示例

目录
[[TOC]]

## 安装依赖(默认已安装)

```shell:no-line-numbers
composer require hyperf/event
```

## 慢SQL监听器

:::details 查看代码
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

## redis异步队列监听器

::: details 查看代码
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

队列长度信息监听器注册

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

## 定时任务异常监听器

::: details 查看代码
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

## 自定义进程异常监听器

::: details 查看代码
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

## 自定义验证规则监听器

::: details 查看代码
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

## 系统级别监听器

::: tip 【规范】
一般系统(或底层)提供的监听器在配置中注册, 除非你要复写它, 否则你应该直接在配置中注册, 而不是通过注解注册。
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