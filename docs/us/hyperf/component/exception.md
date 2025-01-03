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

prev: /us/hyperf/component/limit
next: /us/hyperf/component/log
sidebarDepth: 3

---

# Exception

Index
[[TOC]]

::: tip
1. The return of any ***HTTP*** request should follow a standard response format.
2. Both `code exceptions` and `logic exceptions` should be caught and handled, i.e., return status codes `200`, `401`, `422`, `500`, all in a unified `JSON` format.
3. After configuring exceptions in the `worker process`, the underlying framework will handle them automatically, but exceptions in `custom processes` and queue `consumption processes` should be handled manually.
4. The underlying exceptions of third-party packages should also be encapsulated with corresponding exception handlers.

---
Refer to all exception handlers at:
[Exception Handler](https://github.com/JerryTZF/hyperf-v3/tree/main/app/Exception/Handler)

:::

---

## Encapsulation Of Exception Handler.

**General Exception Handler**

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use AlibabaCloud\Tea\Exception\TeaError;
use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Psr\Http\Message\MessageInterface;
use Psr\Http\Message\ResponseInterface;
use Throwable;

/**
 * 阿里云底层包异常捕获.
 * Class AlibabaExceptionHandler.
 */
class AlibabaExceptionHandler extends ExceptionHandler
{
    /**
     * 处理类.
     * @param Throwable $throwable 异常
     * @param ResponseInterface $response 响应接口实现类
     * @return MessageInterface|ResponseInterface 响应接口实现类
     */
    public function handle(Throwable $throwable, ResponseInterface $response): MessageInterface|ResponseInterface
    {
        $this->stopPropagation();

        return $response->withHeader('Content-Type', 'application/json')
            ->withStatus(200)->withBody(new SwooleStream(json_encode([
                'code' => SystemCode::ALIBABA_ERR,
                'msg' => SystemCode::getMessage(SystemCode::ALIBABA_ERR, [$throwable->getMessage()]),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    /**
     * 是否满足处理条件.
     * @param Throwable $throwable 异常
     * @return bool true|false
     */
    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof TeaError;
    }
}

```
---

**Global Exception Handler**

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

/**
 * 全局兜底异常处理器.
 * Class AppExceptionHandler.
 */
class AppExceptionHandler extends ExceptionHandler
{
    /**
     * 处理类.
     * @param Throwable $throwable 异常
     * @param ResponseInterface $response 响应接口实现类
     * @return ResponseInterface 响应接口实现类
     */
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        Log::error(
            sprintf('发生系统异常:%s', $throwable->getMessage()),
            $throwable->getTrace(),
            $throwable->getTraceAsString()
        );

        return $response->withHeader('Content-Type', 'application/json')
            ->withStatus(500)
            ->withBody(new SwooleStream(json_encode([
                'code' => SystemCode::SYSTEM_ERROR,
                'msg' => SystemCode::getMessage(SystemCode::SYSTEM_ERROR),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    /**
     * 是否满足处理条件.
     * @param Throwable $throwable 异常
     * @return bool true|false
     */
    public function isValid(Throwable $throwable): bool
    {
        return true;
    }
}

```

## Register Exception Handler

::: warning 【Note】
The order should be from small to large granularity.
:::

---

> config/autoload/exceptions.php

---

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handler' => [
        'http' => [
            // JWT认证失败
            App\Exception\Handler\JwtExceptionHandler::class,
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
            // 阿里云包底层异常捕获器
            App\Exception\Handler\AlibabaExceptionHandler::class,
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

## Encapsulation Of Custom Exception

> Typically used for exceptions thrown by your own business logic.

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