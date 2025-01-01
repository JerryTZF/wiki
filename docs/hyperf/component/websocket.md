---
sidebar: [
{text: '📞 事件机制', collapsible: true, children: [
{text: '事件角色和注意事项', link: 'hyperf/component/event/event'},
{text: '代码示例', link: 'hyperf/component/event/code'},
]},
{text: '⏰ 定时任务', link: 'hyperf/component/crontab'},
{text: '⛓ 自定义进程', link: 'hyperf/component/process'},
{text: '📝 文件系统', link: 'hyperf/component/filesystem'},
{text: '🕓 缓存系统', link: 'hyperf/component/cache'},
{text: '📩 异步队列', collapsible: true, children: [
{text: '队列使用', link: 'hyperf/component/queue/overview'},
{text: '注意事项', link: 'hyperf/component/queue/info'},
]},
{text: '🚦 信号处理器', link: 'hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: 'hyperf/component/guzzle'},
{text: '📉 限流器', link: 'hyperf/component/limit'},
{text: '❌ 异常处理器', link: 'hyperf/component/exception'},
{text: '🖨 日志', link: 'hyperf/component/log'},
{text: '📡 命令行', link: 'hyperf/component/command'},
{text: '🔁 WebSocket', link: 'hyperf/component/websocket'},
]

prev: /hyperf/component/command
next: /hyperf/hyperf_component

sidebarDepth: 3

---

# Websocket使用

目录
[[toc]]

## 安装依赖

> [标准库地址](https://packagist.org/packages/hyperf/websocket-server)

```shell:no-line-numbers
composer require hyperf/websocket-server
```
---
::: tip 如果作为客户端使用，请安装客户端。
:::

```shell:no-line-numbers
composer require hyperf/websocket-client
```

## 配置服务

> config/autoload/server.php

```php:no-line-numbers
<?php

declare(strict_types=1);

return [
    'servers' => [
        [
            'name' => 'http',
            'type' => ServerInterface::SERVER_HTTP,
            'host' => '0.0.0.0',
            'port' => 9501,
            'sock_type' => SWOOLE_SOCK_TCP,
            'callbacks' => [
                Event::ON_REQUEST => [Hyperf\HttpServer\Server::class, 'onRequest'],
            ],
        ],
        [
            'name' => 'ws',
            'type' => ServerInterface::SERVER_WEBSOCKET,
            'host' => '0.0.0.0',
            'port' => 9502,
            'sock_type' => SWOOLE_SOCK_TCP,
            'callbacks' => [
                // 这里使用的是我自定义的回调Server
                Event::ON_HAND_SHAKE => [App\Server\WebsocketServer::class, 'onHandShake'],
                Event::ON_MESSAGE => [App\Server\WebsocketServer::class, 'onMessage'],
                Event::ON_CLOSE => [App\Server\WebsocketServer::class, 'onClose'],
            ],
        ],
    ],
];

``` 

## 配置路由

```php:no-line-numbers
<?php

declare(strict_types=1);

use Hyperf\HttpServer\Router\Router;

// WebSocket 暂时不支持注解。
Router::addServer('ws', function () {
    // 可以新增多个WebSocket路由，对应不同的业务逻辑，只要控制器实现了对应的回调即可
    // 这里只做示例
    Router::get('/wss/demo', App\Controller\WebSocket\WebSocketController::class);
});

```

## 控制器

> app/Controller/WebSocket/WebSocketController.php

```php:no-line-numbers
<?php

namespace App\Controller\WebSocket;

use App\Lib\Log\Log;
use App\Model\Users;
use Hyperf\Contract\OnCloseInterface;
use Hyperf\Contract\OnMessageInterface;
use Hyperf\Contract\OnOpenInterface;
use Hyperf\WebSocketServer\Constant\Opcode;

class WebSocketController extends AbstractWebSocketController implements OnMessageInterface, OnOpenInterface, OnCloseInterface
{
    public function onMessage($server, $frame): void
    {
        if ($frame->opcode === Opcode::PING) {
            // 如果使用协程 Server，在判断是 PING 帧后，需要手动处理，返回 PONG 帧。
            // 异步风格 Server，可以直接通过 Swoole 配置处理，详情请见 https://wiki.swoole.com/#/websocket_server?id=open_websocket_ping_frame
            $server->push('', Opcode::PONG);
            return;
        }
        // 模拟关闭连接
        if ($frame->data === 'nihao') {
            $jwt = $this->jwt;
            $userName = Users::query()->where(['id' => $jwt['data']['uid'] ?? 0])->value('account');
            $reason = $userName . ' 已由服务端断开连接';
            $server->disconnect($frame->fd, SWOOLE_WEBSOCKET_CLOSE_NORMAL, $reason);
            return;
        }
        $server->push($frame->fd, 'Recv: ' . $frame->data);
        $server->push($frame->fd, json_encode($this->jwt));
    }

    public function onOpen($server, $request): void
    {
        // 判断鉴权中间件写入上下文的 JWT 信息, 没有 $isOk = false;
        $isOk = $this->authorization($server, $request);
        if ($isOk) {
            $server->push($request->fd, 'Authorization Success');
            Log::stdout()->info($request->fd);
        } else {
            // 外部ws中间件已经尝试解析jwt了, 失败不会连接成功, 这里再加一层判断而已, 不加也OK.
            $server->disconnect($request->fd, SWOOLE_WEBSOCKET_CLOSE_NORMAL, '非法请求');
        }
    }

    public function onClose($server, int $fd, int $reactorId): void
    {
        $jwt = $this->jwt;
        $userName = Users::query()->where(['id' => $jwt['data']['uid'] ?? 0])->value('account');
        $reason = $userName . ' 已由服务端断开连接';
        Log::stdout()->info($reason);
    }
}

```

## 自定义回调服务

::: danger 为什么要自定义回调服务
1. `Hyperf\WebSocketServer\Server` 的协议升级中间件`Hyperf\WebSocketServer\CoreMiddleware`并未处理 `handleNotFound()` 方法。即：请求一个不存在的WS路由会抛出异常。
2. 可以自行处理 `ws` 业务中间件的处理结果。例如鉴权中间件的判断可以在自定义的 `onHandShake` 回调中处理，而不用在已经握手成功后再做处理判断。
3. 可以使用自定义异常进行处理 `ws` 的异常抛出。
   :::

---

> app/Server/WebsocketServer.php

::: details 自定义回调服务
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Server;

use App\Middleware\WebSocketCoreMiddleware;
use Hyperf\Context\Context;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Coordinator\Constants;
use Hyperf\Coordinator\CoordinatorManager;
use Hyperf\Engine\Constant;
use Hyperf\Engine\Contract\WebSocket\WebSocketInterface;
use Hyperf\Engine\WebSocket\WebSocket;
use Hyperf\HttpMessage\Base\Response;
use Hyperf\HttpMessage\Server\Response as Psr7Response;
use Hyperf\HttpServer\MiddlewareManager;
use Hyperf\HttpServer\Router\Dispatched;
use Hyperf\Support\SafeCaller;
use Hyperf\WebSocketServer\Collector\FdCollector;
use Hyperf\WebSocketServer\Context as WsContext;
use Hyperf\WebSocketServer\CoreMiddleware;
use Hyperf\WebSocketServer\Exception\Handler\WebSocketExceptionHandler;
use Hyperf\WebSocketServer\Exception\WebSocketHandeShakeException;
use Hyperf\WebSocketServer\Security;
use Hyperf\WebSocketServer\Server;
use Psr\Http\Message\ResponseInterface;
use Throwable;

/**
 * 覆写 websocket server. 原因:
 * 1. 自定义回调事件异常处理器.
 * 2. 自定义CoreMiddleware中间件(handleFound() && handleNotFound()).
 * 3. 根据自己需求可以修改各个回调事件的逻辑.
 * Class WebsocketServer.
 */
class WebsocketServer extends Server
{
    // 初始化协议升级中间件 && 加载异常处理器
    public function initCoreMiddleware(string $serverName): void
    {
        $this->serverName = $serverName;
        // 注册自定义Core中间件
        $this->coreMiddleware = new WebSocketCoreMiddleware($this->container, $serverName);

        $config = $this->container->get(ConfigInterface::class);
        // 加载 websocket middleware
        $this->middlewares = $config->get('middlewares.' . $serverName, []);
        // 加载 websocket exception handler
        $this->exceptionHandlers = $config->get('exceptions.handler.' . $serverName, [
            WebSocketExceptionHandler::class,
        ]);
    }

    // 握手回调函数
    public function onHandShake($request, $response): void
    {
        try {
            CoordinatorManager::until(Constants::WORKER_START)->yield();
            $fd = $this->getFd($response);
            Context::set(WsContext::FD, $fd);
            $security = $this->container->get(Security::class);

            $psr7Response = $this->initResponse();
            $psr7Request = $this->initRequest($request);

            $this->logger->debug(sprintf('WebSocket: fd[%d] start a handshake request.', $fd));

            $key = $psr7Request->getHeaderLine(Security::SEC_WEBSOCKET_KEY);
            if ($security->isInvalidSecurityKey($key)) {
                throw new WebSocketHandeShakeException('sec-websocket-key is invalid!');
            }

            $psr7Request = $this->coreMiddleware->dispatch($psr7Request);
            $middlewares = $this->middlewares;
            /** @var Dispatched $dispatched */
            $dispatched = $psr7Request->getAttribute(Dispatched::class);
            if ($dispatched->isFound()) {
                $registeredMiddlewares = MiddlewareManager::get($this->serverName, $dispatched->handler->route, $psr7Request->getMethod());
                $middlewares = array_merge($middlewares, $registeredMiddlewares);
            }

            /** @var Response $psr7Response */
            $psr7Response = $this->dispatcher->dispatch($psr7Request, $middlewares, $this->coreMiddleware);
            // 中间件返回的状态码
            $httpCode = $psr7Response->getStatusCode();
            // 协议升级失败(业务中间件不通过)
            if ($httpCode !== 101) {
                $middlewareResponseBody = $psr7Response->getBody()->getContents();
                $middlewareResponseBody = json_decode($middlewareResponseBody, true) ?? [];
                $this->logger->debug($middlewareResponseBody['msg']);
                return;
            }
            $class = $psr7Response->getAttribute(CoreMiddleware::HANDLER_NAME);
            // 未找到路由会得不到该Attr, 原因是路由错误.
            // 参见: app/Middleware/WebSocketCoreMiddleware.php
            if (empty($class)) {
                $this->logger->warning('WebSocket hande shake failed, because the class does not exists (Maybe route error).');
                return;
            }

            FdCollector::set($fd, $class);
            $server = $this->getServer();
            if (Constant::isCoroutineServer($server)) {
                $upgrade = new WebSocket($response, $request);

                $this->getSender()->setResponse($fd, $response);
                $this->deferOnOpen($request, $class, $response, $fd);

                $upgrade->on(WebSocketInterface::ON_MESSAGE, $this->getOnMessageCallback());
                $upgrade->on(WebSocketInterface::ON_CLOSE, $this->getOnCloseCallback());
                $upgrade->start();
            } else {
                $this->deferOnOpen($request, $class, $server, $fd);
            }
        } catch (Throwable $throwable) {
            // Delegate the exception to exception handler.
            $psr7Response = $this->container->get(SafeCaller::class)->call(function () use ($throwable) {
                return $this->exceptionHandlerDispatcher->dispatch($throwable, $this->exceptionHandlers);
            }, static function () {
                return (new Psr7Response())->withStatus(400);
            });

            isset($fd) && FdCollector::del($fd);
            isset($fd) && WsContext::release($fd);
        } finally {
            isset($fd) && $this->getSender()->setResponse($fd, null);
            // Send the Response to client.
            if (isset($psr7Response) && $psr7Response instanceof ResponseInterface) {
                $this->responseEmitter->emit($psr7Response, $response, true);
            }
        }
    }
}

```
:::

## 自定义协议升级中间件

::: tip 说明
补充了路由不正确时的处理方法，内置的 `Hyperf\WebSocketServer\CoreMiddleware` 并不处理 `404`。
:::

> app/Middleware/WebSocketCoreMiddleware.php

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Middleware;

use Hyperf\Context\Context;
use Hyperf\HttpMessage\Base\Response;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\HttpServer\Router\Dispatched;
use Hyperf\WebSocketServer\Exception\WebSocketHandeShakeException;
use Hyperf\WebSocketServer\Security;
use Psr\Http\Message\MessageInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

// 详情参见: vendor/hyperf/websocket-server/src/CoreMiddleware.php
class WebSocketCoreMiddleware extends \Hyperf\HttpServer\CoreMiddleware
{
    public const HANDLER_NAME = 'class';

    /**
     * 如果路由正确, 则协议升级处理.
     * Handle the response when found.
     */
    protected function handleFound(Dispatched $dispatched, ServerRequestInterface $request): ResponseInterface
    {
        [$controller] = $this->prepareHandler($dispatched->handler->callback);
        if (! $this->container->has($controller)) {
            throw new WebSocketHandeShakeException('Router not exist.');
        }

        /** @var Response $response */
        $response = Context::get(ResponseInterface::class);

        $security = $this->container->get(Security::class);

        $key = $request->getHeaderLine(Security::SEC_WEBSOCKET_KEY);
        $response = $response->withStatus(101)->withHeaders($security->handshakeHeaders($key));
        if ($wsProtocol = $request->getHeaderLine(Security::SEC_WEBSOCKET_PROTOCOL)) {
            $response = $response->withHeader(Security::SEC_WEBSOCKET_PROTOCOL, $wsProtocol);
        }

        return $response->withAttribute(self::HANDLER_NAME, $controller);
    }

    /**
     * 路由错误, 直接在握手回调中断开连接.
     * Handle the response when NOT found.
     */
    public function handleNotFound(ServerRequestInterface $request): MessageInterface
    {
        return $this->response()
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Description', 'Route Error')
            ->withStatus(404)->withBody(new SwooleStream(''));
    }
}

```

## 鉴权中间件

::: warning 鉴权方式
对于 `WebSocket` 的鉴权，有两种方式和两种顺序：

**两种方式**: \
1、通过参数传递进行协议升级请求。eg: wss://domain.com/wss?name=Jerry&pwd=xxx。我个人不建议使用这样的参数，一来不够安全，二来不好兼容
`Http` 服务中已有的鉴权方式(JWT或者其他)。\
2、通过添加请求头传递 `jwt` 或 `token`。个人建议 使用 `Authorization` 头信息传递令牌进行鉴权。

**两种顺序**: \
1、握手成功后，在 `onOpen()` 回调中获取头信息或者参数进行业务鉴权处理判断。这种方式其实已经是连接成功(`fd`已经生成)了，然后又主动断开。会有开销。\
2、握手时，通过调用鉴权中间件进行处理判断，然后判断中间件的结果，来判断是否要握手成功。个人推荐该方式。
:::

---

### 代码

> app/Middleware/WebSocketAuthMiddleware.php

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Constants\ErrorCode;
use App\Lib\Jwt\Jwt;
use Hyperf\Stringable\Str;
use Hyperf\WebSocketServer\Context;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Throwable;

// websocket auth check middleware
// handshake 前就进行判断是否允许连接
class WebSocketAuthMiddleware extends AbstractMiddleware
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $isOpenCheck = \Hyperf\Support\env('JWT_OPEN', false);
        // 不开启验证直接通过
        if (! $isOpenCheck) {
            return $handler->handle($request);
        }
        $authorization = $request->hasHeader('authorization') ? $request->getHeaderLine('authorization') : '';
        $route = $request->getUri()->getPath();
        $whiteRouteList = [
            '/wss/demo',
        ];

        // 不在白名单(这里只是简单的示例) || jwt为空
        if (! in_array($route, $whiteRouteList) || $authorization === '') {
            return $this->buildErrorResponse(ErrorCode::JWT_EMPTY_ERR);
        }

        try {
            $jwt = Str::startsWith($authorization, 'Bearer') ? Str::after($authorization, 'Bearer ') : $authorization;
            // jwt 解析失败
            $explainJwt = Jwt::explainJwt($jwt);
        } catch (Throwable $e) {
            return $this->buildErrorResponse(ErrorCode::DO_JWT_FAIL);
        }

        // 写入上下文, 以便在回调中可以获取
        Context::set('jwt', $explainJwt);
        return $handler->handle($request);
    }
}

```

### 注册

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'http' => [
        ...
    ],
    // websocket 中间件
    'ws' => [
        // 验证中间件
        App\Middleware\WebSocketAuthMiddleware::class,
    ],
];

```

## 自定义异常

### 代码

> app/Exception/Handler/WebsocketExceptionHandler.php

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Exception\Handler;

use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Exception\HttpException;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\WebSocketServer\Exception\InvalidMethodException;
use Hyperf\WebSocketServer\Exception\WebSocketHandeShakeException;
use Hyperf\WebSocketServer\Exception\WebSocketMessageException;
use Psr\Http\Message\MessageInterface;
use Psr\Http\Message\ResponseInterface;
use Throwable;

// 参见: vendor/hyperf/websocket-server/src/Exception/Handler/WebSocketExceptionHandler.php
class WebsocketExceptionHandler extends ExceptionHandler
{
    public function handle(Throwable $throwable, ResponseInterface $response): MessageInterface|ResponseInterface
    {
        $this->stopPropagation();

        if ($throwable instanceof HttpException) {
            $response = $response->withStatus($throwable->getStatusCode());
        }
        $stream = new SwooleStream($throwable->getMessage());
        return $response->withBody($stream);
    }

    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof WebSocketHandeShakeException
            || $throwable instanceof InvalidMethodException
            || $throwable instanceof WebSocketMessageException;
    }
}

```

### 注册

> config/autoload/exceptions.php

```php:no-line-numbers
<?php

declare(strict_types=1);

return [
    'handler' => [
        'http' => [
            ...
        ],
        // websocket exception handler
        'ws' => [
            App\Exception\Handler\WebsocketExceptionHandler::class,
        ],
    ],
];

```