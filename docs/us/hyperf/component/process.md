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

prev: /us/hyperf/component/crontab
next: /us/hyperf/component/filesystem
sidebarDepth: 3

---

# Processes


Index
[[TOC]]

::: warning 【Guidelines】
For the processes provided by the system (framework), if no inheritance or modification is required, please declare them in the configuration files. We should follow these rules:
- 1、If a component provides the corresponding process and no customization is needed, declare it in `config/autoload/process.php`.
- 2、For custom components (business needs), create a `Process` directory under the `app` directory, and place all custom process files within it. Custom processes should be declared using ***annotations***.

In summary: system (framework) processes should be declared in configuration files; custom processes should be declared using ***annotations***.
:::

::: tip
- Throwing exceptions will cause the process to exit, and it will be restarted by the Server. It is recommended to use `try-catch-finally` in custom processes and throw custom exceptions.
- Cron jobs are essentially custom processes, but they handle exceptions differently (you need to listen for exception events).
:::

---

## Register Custom Processes

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Process;

use App\Lib\Log\Log;
use Exception;
use Hyperf\Coroutine\Coroutine;
use Hyperf\Process\AbstractProcess;
use Hyperf\Process\Annotation\Process;
use Hyperf\Process\ProcessManager;
use Throwable;

#[Process(
    nums: 1, // 进程数目
    name: 'ConsumerProcess',
    redirectStdinStdout: false,
    pipeType: 2,
    enableCoroutine: true // 进程内是否启用协程
)]
class ConsumerProcess extends AbstractProcess
{
    public function handle(): void
    {
        $index = 0;
        try {
            while (ProcessManager::isRunning()) {
                Coroutine::sleep(1);
                ++$index;
                // 模拟异常
                if ($index === 10) {
                    throw new Exception('主动抛出异常');
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
        return \Hyperf\Support\env('APP_ENV', 'dev') === 'dev';
    }
}

```

---

## Override System Processes

::: tip 【Note】
Some system processes may require us to manage or modify the logic ourselves, 
in which case we need to inherit the corresponding consumer process and then register it ourselves.
If no changes are needed, it can simply be configured in `config/autoload/process.php`. 
I personally prefer to manage it myself. 😁
:::

---

::: tabs
@tab AsyncQueue Consumer Process
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
@tab Parallel Concurrency of 1
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Process\OverloadProcess;

use App\Constants\ConstCode;
use Hyperf\AsyncQueue\Process\ConsumerProcess;
use Hyperf\Process\Annotation\Process;

#[Process(
    nums: 1, // 消费者进程数
    name: 'LockQueueProcess', // 队列名称
    redirectStdinStdout: false, // 重定向自定义进程的标准输入和输出
    enableCoroutine: true, // 是否启用协程
)]
class LockQueueProcess extends ConsumerProcess
{
    // 这里的队列名称请和配置文件对应的队列名称保持一致
    protected string $queue = ConstCode::LOCK_QUEUE_NAME;
}

```
@tab Scheduled Task Consumer Process
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Process\OverloadProcess;

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
:::
