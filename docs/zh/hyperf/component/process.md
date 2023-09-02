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

prev: /zh/hyperf/component/crontab
next: /zh/hyperf/component/filesystem
sidebarDepth: 3

---

# 自定义进程


目录
[[TOC]]

::: warning 【规范】
系统(框架)提供的进程，如果不需要继承修改，请尽量放在配置文件中进行声明。我们应当遵循：
- 1、组件已提供对应进程且不需要自定义的，请在 `config/autoload/process.php` 中声明
- 2、自定义组件(业务需要)，应当在 `app` 目录下创建 `Process` 目录，且所有自定义进程文件放入其中，
  自定义进程使用 `注解` 方式声明。

即：系统(框架)进程在配置文件中声明；自定义进程使用 **注解** 声明。
:::

::: tip
- 抛出异常会退出进程，会被Server重新拉起。建议在自定义进程中，使用 `try-catch-finally` , 并且抛出自己定义的异常。
- 定时任务本质上也是自定义进程操作，但是它会对异常处理(需要监听异常事件)
:::

---

## 注册自定义进程

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