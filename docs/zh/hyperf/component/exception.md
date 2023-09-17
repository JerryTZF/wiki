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

prev: /zh/hyperf/component/limit
next: /zh/hyperf/component/log
sidebarDepth: 3

---

# 异常处理器

目录
[[TOC]]

::: tip
1. 任何的 **HTTP请求** 的返回均应该返回标准格式的响应。
2. `代码异常` 和 `逻辑异常` 都应该捕获和处理，即：均返回 `200` 状态码，且为统一的 `JSON` 格式。
3. `worker` 进程中的异常配置后，底层框架会自动处理，但是 `自定义进程`，`队列消费进程` 中的异常应自己处理。
4. 三方包的底层异常，也应该封装对应的异常处理器。
:::

---

## 封装异常处理器

> 普通异常处理器

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Lysice\HyperfRedisLock\LockTimeoutException;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class LockTimeoutExceptionHandler extends ExceptionHandler
{
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        $this->stopPropagation();

        return $response->withHeader('Content-Type', 'application/json')
            ->withStatus(200)->withBody(new SwooleStream(json_encode([
                'code' => SystemCode::LOCK_WAIT_TIMEOUT,
                'msg' => SystemCode::getMessage(SystemCode::LOCK_WAIT_TIMEOUT),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof LockTimeoutException;
    }
}
```

> 全局异常处理器

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use App\Constants\SystemCode;
use App\Lib\Log\Log;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class AppExceptionHandler extends ExceptionHandler
{
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        $errorInfo = sprintf(
            '发生系统异常:%s;行号为:[%s]; 文件为:[%s]; Trace为:[%s]',
            $throwable->getMessage(),
            $throwable->getLine(),
            $throwable->getFile(),
            $throwable->getTraceAsString()
        );
        Log::error($errorInfo);

        return $response->withHeader('Content-Type', 'application/json')
            ->withStatus(500)
            ->withBody(new SwooleStream(json_encode([
                'code' => SystemCode::SYSTEM_ERROR,
                'msg' => SystemCode::getMessage(SystemCode::SYSTEM_ERROR),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    public function isValid(Throwable $throwable): bool
    {
        return true;
    }
}
```

## 注册异常处理器

::: warning 【说明】
顺序应该由颗粒度有小到大。
:::

---

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handler' => [
        'http' => [
            // 业务逻辑异常
            App\Exception\Handler\BusinessExceptionHandler::class,
            // 验证器类型错误处理
            App\Exception\Handler\ValidationExceptionHandler::class,
            // 文件系统异常捕获
            App\Exception\Handler\FileSystemExceptionHandler::class,
            // 数据库未找到数据异常处理
            App\Exception\Handler\ModelNotFoundExceptionHandler::class,
            // 限流异常处理器
            App\Exception\Handler\RateLimitExceptionHandler::class,
            // redis锁组件异常处理器
            App\Exception\Handler\LockTimeoutExceptionHandler::class,
            // phpoffice 包异常捕获
            App\Exception\Handler\OfficeExceptionHandler::class,
            // PHPSeclib 包异常捕获
            App\Exception\Handler\PHPSeclibExceptionHandler::class,
            // 全局(框架)异常处理
            App\Exception\Handler\AppExceptionHandler::class,
            // 全局HTTP异常处理
            Hyperf\HttpServer\Exception\Handler\HttpExceptionHandler::class,
        ],
    ],
];
```

## 封装自定义异常

> 一般用于自己业务抛出的异常。

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception;

use App\Constants\ErrorCode;
use Hyperf\Server\Exception\ServerException;
use Throwable;

class BusinessException extends ServerException
{
    public function __construct(int $code = 0, string $message = null, Throwable $previous = null)
    {
        if (is_null($message)) {
            $message = ErrorCode::getMessage($code);
        }

        parent::__construct($message, $code, $previous);
    }
}
```