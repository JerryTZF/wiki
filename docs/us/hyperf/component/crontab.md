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

prev: /us/hyperf/component/event/code
next: /us/hyperf/component/process
sidebarDepth: 3

---

# Crontab

Index
[[TOC]]

::: tip

- The `Hyperf scheduled tasks` are essentially processes started by `Swoole`, and they start alongside the `Hyperf service` (configurable).
- Here, a `multi-process` mode is used, and the coroutine mode has not been implemented yet, so it is not summarized for now.
:::

## Install Dependencies

```shell:no-line-numbers
composer require hyperf/crontab
```

## Registering the Execution Process

> 👇🏻 You can choose one of the following.

### Custom Execution Process

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Process;

use Hyperf\Crontab\Process\CrontabDispatcherProcess;
use Hyperf\Process\Annotation\Process;

#[Process(
    nums: 1, // 进程数目
    name: 'SchedulerProcess', // 进程名称
    redirectStdinStdout: false, // 重定向自定义进程的标准输入和输出
    pipeType: 2, // 管道类型
    enableCoroutine: true // 进程内是否启用协程
)]
class SchedulerProcess extends CrontabDispatcherProcess
{
    public string $name = 'scheduler-process';
}

```

### Using System Execution Process

> config/autoload/processes.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 定时任务调度器进程
    Hyperf\Crontab\Process\CrontabDispatcherProcess::class,
];
```

## Enable on Service Startup

> config/autoload/crontab.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 是否开启定时任务
    'enable' => true,
];
```

## Define a Task

::: tabs
@tab Abstract Scheduler
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Scheduler;

use App\Constants\ConstCode;
use Hyperf\Cache\Cache;
use Hyperf\Context\ApplicationContext;

class AbstractScheduler
{
    // 定时任务逻辑是否执行(外部变量控制)
    protected bool $isRunning;

    public function __construct()
    {
        $cache = ApplicationContext::getContainer()->get(Cache::class);
        // 命令行命令 可以开启或关闭该开关 eg: php bin/hyperf crontab:switch start
        $isRunning = $cache->get(ConstCode::SCHEDULER_IS_RUNNING_KEY, false);
        $this->isRunning = ! ($isRunning === false);
    }
}

```
@tab Crontab
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Scheduler;

use App\Lib\Log\Log;
use Carbon\Carbon;
use Hyperf\Crontab\Annotation\Crontab;
use Throwable;

#[Crontab(
    rule: '\/10 * * * * *', // 定时任务规则
    name: 'DemoScheduler', // 定时任务名称
    singleton: true, // 并发执行只有一个被执行,例如: 很多个任务都是10:00AM执行时
    onOneServer: true, // 多实例部署项目时，则只有一个实例会被触发
    callback: 'execute', // 消费方法
    memo: '测试定时任务', // 备注
    enable: 'isEnable', // 是否启动
)]
class DemoScheduler extends AbstractScheduler
{
    // 就算不捕获异常, 底层执行也有事件触发器触发, 会被外部监听器监听到
    public function execute(): void
    {
        if (! $this->isRunning) {
            Log::stdout()->info('DemoScheduler 消费逻辑已跳出');
            return;
        }
        try {
            // TODO your crontab task.
            Log::stdout()->info(Carbon::now()->toDateTimeString());
        } catch (Throwable $e) {
            // TODO catch exception logic
            Log::stdout()->error($e->getMessage());
        } finally {
            Log::stdout()->info('DemoScheduler 执行完成');
        }
    }

    public function isEnable(): bool
    {
        return true;
    }
}

```
:::

---

::: warning 【Note】

- Annotation Fields for Reference：[Crontab Attr](https://hyperf.wiki/3.0/#/zh-cn/crontab?id=%e4%bb%bb%e5%8a%a1%e5%b1%9e%e6%80%a7)
- Note that when defining annotations, if the rule contains the `\` symbol, it needs to be escaped, i.e., use `*\/5 * * * * *`.
- Add a command-line command to control whether the scheduled task executes.
When executing: `php bin/hyperf crontab:switch stop`, the custom process will still run according to the execution rule, 
- but the actual business logic will not be executed. You can think of it as "idling."
:::

---

## Manually trigger scheduled tasks.

> When the service is not started, you can use the command-line command to manually execute the scheduled task.**<Badge type="tip" text="Hyperf v3.x" vertical="middle" />**

```shell:no-line-numbers
php bin/hyperf.php crontab:run
```
---
![](https://img.tzf-foryou.xyz/img/20231226005658.png)

---

## Run Fail

:::tip (￣▽￣)"
> The component provides the `FailToExecute` event, and you can write the corresponding listener.

[System-level Listener](/us/hyperf/component/event/code.md#system-level-listener)
:::

