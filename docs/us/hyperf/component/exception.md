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

# 异常处理器

目录
[[TOC]]

::: tip
1. 任何的 **HTTP请求** 的返回均应该返回标准格式的响应。
2. `代码异常` 和 `逻辑异常` 都应该捕获和处理，即：均返回 `200`、`401`、`422`、`500`  状态码，且为统一的 `JSON` 格式。
3. `worker` 进程中的异常配置后，底层框架会自动处理，但是 `自定义进程`，`队列消费进程` 中的异常应自己处理。
4. 三方包的底层异常，也应该封装对应的异常处理器。

---
所有异常处理器参见：
[异常处理器](https://github.com/JerryTZF/hyperf-v3/tree/main/app/Exception/Handler)

:::

---

## 封装异常处理器

**普通异常处理器**

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

**全局异常处理器**

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

## 注册异常处理器

::: warning 【说明】
顺序应该由颗粒度有小到大。
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