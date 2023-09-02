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
{text: '📩 异步队列', link: '/zh/hyperf/component/queue'},
{text: '🚦 信号处理器', link: '/zh/hyperf/component/signal'},
{text: '📤 http', link: '/zh/hyperf/component/guzzle'},
{text: '📉 限流器', link: '/zh/hyperf/component/limit'},
{text: '📮 异步Task', link: '/zh/hyperf/component/task'},
{text: '❌ 异常处理器', link: '/zh/hyperf/component/exception'},
{text: '🖨 日志', link: '/zh/hyperf/component/log'},
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

## 慢日志监听器

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

            // 大于500毫秒记录日志
            if ($event->time > 500) {
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
use Hyperf\Event\Contract\ListenerInterface;

class SchedulerErrorListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            FailToExecute::class,
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof FailToExecute) {
            $info = sprintf('[定时任务异常监听器][任务:%s][错误:%s]', $event->crontab->getName(), $event->throwable->getMessage());
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
                Log::warning(sprintf('[自定义进程停止][进程:%s][第 %s 个进程]', $event->process->name, $event->index));
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

