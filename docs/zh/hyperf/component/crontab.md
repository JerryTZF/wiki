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

prev: /zh/hyperf/component/event/code
next: /zh/hyperf/component/process
sidebarDepth: 3

---

# 定时任务

目录
[[TOC]]

::: tip

- `Hyperf` 定时任务本质上是 `Swoole` 拉起的一个进程，并且随着 `Hyperf` 服务启动而启动(可以配置)。
- 这里采用 `多进程` 模式，协程模式暂未使用，暂不总结。
:::

## 安装依赖

```shell:no-line-numbers
composer require hyperf/crontab
```

## 注册执行进程

> 👇🏻 二选一即可。

### 自定义执行进程

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

### 使用系统执行进程

> config/autoload/processes.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 定时任务调度器进程
    Hyperf\Crontab\Process\CrontabDispatcherProcess::class,
];
```

## 开启随服务启动

> config/autoload/crontab.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    // 是否开启定时任务
    'enable' => true,
];
```

## 定义任务

:::: code-group
::: code-group-item 定时任务抽象类
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
:::
::: code-group-item 定时任务
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
::::

---

::: warning 【注意】

- 注解字段请参考：[任务属性](https://hyperf.wiki/3.0/#/zh-cn/crontab?id=%e4%bb%bb%e5%8a%a1%e5%b1%9e%e6%80%a7)
- 注意在注解定义时，规则存在 `\` 符号时，需要进行转义处理，即填写 `*\/5 * * * * *`
- 新增命令行命令控制定时任务是否执行任务。当执行：`php bin/hyperf crontab:switch stop` 时，自定义进程依旧会按照执行规则执行，但是不会执行真正的业务逻辑。
你可以理解为 `空转`。
:::

---

## 手动触发定时任务

> 当服务没有启动，想手动执行定时任务时，可以使用命令行命令执行。**<Badge type="tip" text="Hyperf v3.x" vertical="middle" />**

```shell:no-line-numbers
php bin/hyperf.php crontab:run
```
---
![](https://img.tzf-foryou.xyz/img/20231226005658.png)

---

## 执行失败

:::tip (￣▽￣)"
> 组件提供了 `FailToExecute` 事件，编写对应的监听器即可。

[定时任务异常监听器](/zh/hyperf/component/event/code.md#定时任务异常监听器)
:::

