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
]


prev: /zh/hyperf/component/exception
next: /zh/hyperf/hyperf_component
sidebarDepth: 3

---

# 日志

目录
[[TOC]]

::: tip
- 日志处理的 `Handler` 有 `Monolog\Handler\StreamHandler` 、 `Monolog\Handler\RotatingFileHandler`，这里的配置
  是 `按照日期轮转` 的处理器。
- `INFO` 及以上级别的日志会写入info日志，`ERROR` 及以上级别的日志会写入error日志。按照每天进行分割。
- `Hyperf` 是参考了 `monolog` 的一些内容，详见：[Monolog](https://github.com/Seldaek/monolog)。
:::

## 安装依赖

```shell:no-line-numbers
composer require hyperf/logger
```

## 日志配置

> config/autoload/logger.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'default' => [
        'handlers' => [
            // 记录INFO级别及以上等级日志
            [
                'class' => Monolog\Handler\RotatingFileHandler::class,
                'constructor' => [
                    'filename' => BASE_PATH . '/runtime/logs/info.log',
                    'level' => Monolog\Logger::INFO,
                ],
                'formatter' => [
                    'class' => Monolog\Formatter\LineFormatter::class,
                    'constructor' => [
                        'format' => "[%datetime%]|[%channel%]|[%level_name%]|[%message%]|[%context%]\n",
                        'dateFormat' => 'Y-m-d H:i:s',
                        'allowInlineLineBreaks' => true,
                    ],
                ],
            ],
            // 记录ERROR及以上日志
            [
                'class' => Monolog\Handler\RotatingFileHandler::class,
                'constructor' => [
                    'filename' => BASE_PATH . '/runtime/logs/error.log',
                    'level' => Monolog\Logger::ERROR,
                ],
                'formatter' => [
                    'class' => Monolog\Formatter\LineFormatter::class,
                    'constructor' => [
                        'format' => "[%datetime%]|[%channel%]|[%level_name%]|[%message%]|[%context%]\n",
                        'dateFormat' => 'Y-m-d H:i:s',
                        'allowInlineLineBreaks' => true,
                    ],
                ],
            ],
        ],
    ],
];
```

> 示例：
> ![](https://img.tzf-foryou.xyz/img/20220320181530.png)

## 封装调用

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Lib\Log;

use Carbon\Carbon;
use Hyperf\Context\ApplicationContext;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\Log\LoggerInterface;

/**
 * @method static void info(string $msg, array $content = [])
 * @method static void warning(string $msg, array $content = [])
 * @method static void error(string $msg, array $content = [])
 * @method static void alert(string $msg, array $content = [])
 * @method static void critical(string $msg, array $content = [])
 * @method static void emergency(string $msg, array $content = [])
 * @method static void notice(string $msg, array $content = [])
 */
class Log
{
    /**
     * 静态调用.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function __callStatic(string $level, array $args = []): void
    {
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2);
        $trace = array_pop($trace);

        [$now, $caller, $message] = [
            Carbon::now()->toDateTimeString(),
            "{$trace['class']}@{$trace['function']}",
            $args[0],
        ];

        $msg = "[time: {$now}]|[caller: {$caller}]|[message: {$message}]";

        // CLI输出(没有$content)
        static::stdout()->{$level}($msg);
        // DISK输出
        static::get($caller)->{$level}($msg, $args[1] ?? []);
    }

    /**
     * 获取Logger实例.
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface
     */
    public static function get(string $channel = ''): LoggerInterface
    {
        return ApplicationContext::getContainer()->get(LoggerFactory::class)->get($channel);
    }

    /**
     * CLI 日志实例.
     * @throws ContainerExceptionInterface|NotFoundExceptionInterface
     */
    public static function stdout(): StdoutLoggerInterface
    {
        return ApplicationContext::getContainer()->get(StdoutLoggerInterface::class);
    }
}
```