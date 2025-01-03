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


prev: /us/hyperf/component/exception
next: /us/hyperf/component/command
sidebarDepth: 3

---

# Logs

Index
[[TOC]]

::: tip
- The log handling `Handler` includes `Monolog\Handler\StreamHandler` and `Monolog\Handler\RotatingFileHandler`, where the configuration is for a processor that rotates based on the date.
- Logs of `INFO` level and above will be written to the info log, and logs of `ERROR` level and above will be written to the error log. The logs are split by day.
- `Hyperf` has referenced some content from `monolog`. For more details, see: [Monolog](https://github.com/Seldaek/monolog).
:::

## Install Dependencies

```shell:no-line-numbers
composer require hyperf/logger
```

## Log Config

> config/autoload/logger.php

---

```php:no-line-numbers
<?php

declare(strict_types=1);
use Monolog\Level;

return [
    'default' => [
        'handlers' => [
            // 记录INFO级别及以上等级日志
            [
                'class' => Monolog\Handler\RotatingFileHandler::class,
                'constructor' => [
                    'filename' => BASE_PATH . '/runtime/logs/info.log',
                    'level' => Level::Info,
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
                    'level' => Level::Error,
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

> Example: 
> ![](https://img.tzf-foryou.xyz/img/20220320181530.png)

## Encapsulation Of The Call.

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Lib\Log;

use App\Constants\ConstCode;
use App\Job\ReportLogJob;
use App\Lib\RedisQueue\RedisQueueFactory;
use Carbon\Carbon;
use Hyperf\Context\ApplicationContext;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Coroutine\Coroutine;
use Hyperf\Logger\LoggerFactory;
use Hyperf\Stringable\Str;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\Log\LoggerInterface;

/**
 * @method static void info(string $msg, array $content = [], string $straceString = '')
 * @method static void warning(string $msg, array $content = [], string $straceString = '')
 * @method static void error(string $msg, array $content = [], string $straceString = '')
 * @method static void alert(string $msg, array $content = [], string $straceString = '')
 * @method static void critical(string $msg, array $content = [], string $straceString = '')
 * @method static void emergency(string $msg, array $content = [], string $straceString = '')
 * @method static void notice(string $msg, array $content = [], string $straceString = '')
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
        // 获取最近两层的调用栈信息
        [$headTrace, $lastTrace] = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2);
        // 静态调用参数处理
        [$message, $context, $traceString] = [
            $args[0] ?? '',
            $args[1] ?? [],
            $args[2] ?? '',
        ];
        // 节点channel
        $channel = "{$lastTrace['class']}@{$lastTrace['function']}";
        // 当前日期
        $nowDate = Carbon::now()->toDateTimeString();
        // string context
        $contextString = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // 异步队列写入数据库(可以用其他方式替代日志上报)
        $jobParams = [
            'level' => Str::upper($level),
            'class' => $lastTrace['class'],
            'function' => $lastTrace['function'],
            'message' => $message,
            'context' => $contextString,
            'file' => $headTrace['file'],
            'line' => $headTrace['line'],
            'trace' => $traceString,
        ];
        Coroutine::create(function () use ($jobParams) {
            $job = new ReportLogJob(uniqid(), $jobParams);
            RedisQueueFactory::safePush($job, ConstCode::LOCK_QUEUE_NAME, 0);
        });

        // CLI输出
        $stdoutMessage = $traceString === '' ?
            "[{$nowDate}][{$channel}][{$message}]" :
            "[{$nowDate}][{$channel}][{$message}]\n{$traceString}";
        static::stdout()->{$level}($stdoutMessage);
        // DISK输出
        static::get($channel)->{$level}($message, $context);
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