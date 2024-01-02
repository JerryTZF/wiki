---
sidebar: [
{text: '🖼 图像相关', collapsible: true, children: [
{'text': '二维码', link: '/zh/hyperf/web/image/qrcode'},
{'text': '条形码', link: '/zh/hyperf/web/image/barcode'},
{'text': '验证码', link: '/zh/hyperf/web/image/captcha'},
]},
{text: '🔐 锁相关', collapsible: true, children: [
{'text': 'Redis分布式锁', link: '/zh/hyperf/web/lock/redis'},
{'text': '数据库悲观锁', link: '/zh/hyperf/web/lock/pessimism'},
{'text': '数据库乐观锁', link: '/zh/hyperf/web/lock/optimistic'},
{'text': '队列(单个消费)', link: '/zh/hyperf/web/lock/queue'},
]},
{text: '🏢 Office相关', collapsible: true, children: [
{'text': '数据导出Excel', link: '/zh/hyperf/web/office/excel'},
{'text': '数据导出Csv', link: '/zh/hyperf/web/office/csv'},
]},
{text: '↔️ 加解密', collapsible: true, children: [
{'text': 'AES', link: '/zh/hyperf/web/convert/aes'},
{'text': 'RSA', link: '/zh/hyperf/web/convert/rsa'},
{'text': 'AWS4', link: '/zh/hyperf/web/convert/aws4'},
{'text': 'RC4', link: '/zh/hyperf/web/convert/rc4'},
]},
{text: '🍪 登录相关', collapsible: true, children: [
{'text': 'JWT', link: '/zh/hyperf/web/login/jwt'},
{'text': 'Cookie', link: '/zh/hyperf/web/login/cookie'},
{'text': 'Session', link: '/zh/hyperf/web/login/session'},
{'text': 'Q&A', link: '/zh/hyperf/web/login/qa'},
]},
{text: '📀 服务部署', collapsible: true, children: [
{'text': '说明', link: '/zh/hyperf/web/deployment/description'},
{'text': '部署流程', link: '/zh/hyperf/web/deployment/detail'},
]},
{text: '⛓ Websocket', collapsible: true, children: [
]},
]

prev: /zh/hyperf/web/convert/rc4
next: /zh/hyperf/web/login/cookie
sidebarDepth: 3
---

# Jwt

目录

[[toc]]

## 基本概念

### 什么是Jwt

> JWT: JSON WEB TOKEN

JSON Web Token (JWT)是一个开放标准(RFC 7519)，它定义了一种紧凑的、自包含的方式，用于作为JSON对象在各方之间安全地传输信息。该信息可以被验证和信任，因为它是数字签名的。

### 结构和组成部分

> 一个标准的Jwt应该由 `Header`、`Payload`、`Signature` 三部分组成。且三部分由 `.` 拼接而成。eg: `xxxx.yyyy.zzzz`

---

**Header**

```json:no-line-numbers
// base64 对 这个JSON编码就得到第一部分 xxxx
{
    "typ": "JWT", // 类型
    "alg": "HS256" // 签名算法声明
}
```

**Payload**

::: danger
注意，不要在 `JWT` 的 `payload` 或 `header` 中放置敏感信息，除非它们是加密的。因为 `payload` 、`header` 都可以解出来。
:::

```json:no-line-numbers
// base64 对 这个JSON编码就得到第二部分: yyyy
{
    "iss": "issuer", // 颁发者
    "sub": "accredit", // 主题
    "aud": "mobile_user", // 接收者
    "iat": "1703345600", // jwt发出时间
    "nbf": "1703345601", // jwt的开始处理的时间(颁发jwt后一秒才能进行解析jwt)
    "exp": "1703346601", // 到期时间
    "data": {"uid": 221, "rid": [1,2,3,4]}} // 业务数据(不能添加敏感数据)
}
```

**Signature**

::: tip 【说明】
签名是用于验证消息在传递过程中有没有被更改，并且，对于使用私钥签名的 `token`，它还可以验证 `JWT` 的发送方是否为它所称的发送方。
:::

使用 `Header` 声明的算法对 `Header`和`Payload`进行签名(加密)就得到 `Signature`，例如：
> hash_hmac('SHA256', 'xxxx.yyyy', 'SECRET')

---

### 使用示例

```shell:no-line-numbers
curl --location 'http://127.0.0.1:9501/auth/sync/test' \
--header 'Authorization: Bearer xxxx.yyyy.zzzz'
```

## 使用

### 安装依赖

> [标准库地址](https://packagist.org/packages/firebase/php-jwt)

```shell:no-line-numbers
composer require firebase/php-jwt
```

### 代码封装

::: details 代码详情
```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Lib\Jwt;

use Carbon\Carbon;
use Firebase\JWT\Key;

class Jwt
{
    // 可用的签名算法
    private const ES384 = 'ES384';

    private const ES256 = 'ES256';

    private const ES256K = 'ES256K';

    private const HS256 = 'HS256';

    private const HS384 = 'HS384';

    private const HS512 = 'HS512';

    private const RS256 = 'RS256';

    private const RS384 = 'RS384';

    private const RS512 = 'RS512';

    // TODO:
    // 1、如果你想让某些jwt主动失效, 那么需要进行存储, 然后对其删除或者变更, 那么之前颁发的jwt将无法通过验证
    // 2、如果想实现自动延时, 那么可以颁发两个jwt(access_token, refresh_token), 两个jwt有效期不一样,
    // access_token 失效后验证 refresh_token, 通过后再次颁发access_token

    /**
     * 获取jwt.
     * @param array|int|string $data 待加密的数据
     * @param int $expire 失效秒数
     * @return string jwt
     */
    public static function createJwt(array|int|string $data, int $expire = 0): string
    {
        $key = \Hyperf\Support\env('JWT_KEY', 'hyperf');
        $now = Carbon::now()->timestamp;
        $payload = [
            'iss' => \Hyperf\Support\env('APP_DOMAIN', 'hyperf'), // 颁发者,
            'sub' => 'accredit', // 主题,
            'aud' => 'pc', // 接收者
            'iat' => $now, // jwt发出的时间
            'nbf' => $now + 1, // jwt的开始处理的时间(颁发jwt后一秒才能进行解析jwt)
            'exp' => $expire === 0 ? $now + 60 * 60 : $expire, // 到期时间
            'data' => is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data,
        ];
        $head = [
            'typ' => 'JWT', // 令牌类型
            'cty' => '', // 内容类型
            'kid' => null, // 秘钥标识
        ];
        $keyId = null;
        return \Firebase\JWT\JWT::encode($payload, $key, self::HS256, $keyId, $head);
    }

    /**
     * 解析jwt.
     * @param string $jwt 待解析的jwt
     * @return array payload
     */
    public static function explainJwt(string $jwt): array
    {
        $key = \Hyperf\Support\env('JWT_KEY', 'hyperf');
        $payload = \Firebase\JWT\JWT::decode($jwt, new Key($key, self::HS256));
        $payload = get_object_vars($payload);
        if (isset($payload['data'])) {
            $payload['data'] = json_decode((string) $payload['data'], true) ?? $payload['data'];
        }
        return $payload;
    }

    /**
     * jwt距离失效还有的秒数.
     * @param string $jwt jwt
     * @return int 距离失效的秒数
     */
    public static function jwtLeftSeconds(string $jwt): int
    {
        $payload = self::explainJwt($jwt);
        $exp = $payload['exp'];
        return (Carbon::now()->timestamp - $exp) > 0 ? (Carbon::now()->timestamp - $exp) : 0;
    }
}

```
:::

### 中间件验证

```php:no-line-numbers
<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Middleware;

use App\Constants\ErrorCode;
use App\Lib\Cache\Cache;
use App\Lib\Jwt\Jwt;
use App\Service\LoginService;
use Hyperf\Context\Context;
use Hyperf\Stringable\Str;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AccreditMiddleware extends AbstractMiddleware
{
    /**
     * jwt验证.
     * 原则上只检测jwt相关, 权限等在AuthMiddleware中间件实现.
     * @param ServerRequestInterface $request 请求类
     * @param RequestHandlerInterface $handler 处理器
     * @return ResponseInterface 响应
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        [$authorization, $isLoginPath, $isTestPath, $isOpenCheck] = [
            $request->hasHeader('authorization') ? $request->getHeaderLine('authorization') : '',
            $this->request->is('login/*'),
            $this->request->is('test/*'),
            \Hyperf\Support\env('JWT_OPEN', false),
        ];

        // 不开启验证 || 登录相关
        if (! $isOpenCheck || $isLoginPath || $isTestPath) {
            return $handler->handle($request);
        }

        // 非权限路由且不存在jwt
        if ($authorization === '') {
            return $this->buildErrorResponse(ErrorCode::JWT_EMPTY_ERR);
        }
        $jwt = Str::startsWith($authorization, 'Bearer') ? Str::after($authorization, 'Bearer ') : $authorization;
        $originalData = Jwt::explainJwt($jwt); // 解析过程中的异常, 会被 JwtExceptionHandler 捕获, 这里无需处理

        // JWT是否被主动失效 || JWT是否正确
        $uid = $originalData['data']['uid'] ?? 0;
        $storageJwt = Cache::get(sprintf(LoginService::JWT_CACHE_KEY, $uid));
        if ($storageJwt !== $jwt) {
            return $this->buildErrorResponse(ErrorCode::DO_JWT_FAIL);
        }

        // TODO 可以根据 payload 的数据进行其他的判断操作. 这里直接将 payload 向下游传递.
        $request = Context::set(ServerRequestInterface::class, $request->withAttribute('jwt', $originalData));

        return $handler->handle($request);
    }
}

```

## 注意事项

- `header`、`payload` 不要添加敏感信息。应该添加一些非常重要且高频的数据。
- `jwt` 有效期一般应该保存一个或者几个小时，最好不要设置很长的有效期。
- 原则上应该只验证不存储。为解决 `Jwt` 无法主动失效问题，我这里进行了存储(黑白名单)，否则和 `Session` 没有什么区别, 但是这样不依赖于 `Cookie`。