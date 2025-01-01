---
sidebar: [
{text: '🖼 Images', collapsible: true, children: [
{'text': 'Qrcode', link: 'hyperf/web/image/qrcode'},
{'text': 'Barcode', link: 'hyperf/web/image/barcode'},
{'text': 'Captcha', link: 'hyperf/web/image/captcha'},
]},
{text: '🔐 Locks', collapsible: true, children: [
{'text': 'Redis Lock', link: 'hyperf/web/lock/redis'},
{'text': 'Database Pessimistic Locking', link: 'hyperf/web/lock/pessimism'},
{'text': 'Database Optimistic Locking', link: 'hyperf/web/lock/optimistic'},
{'text': 'Queue(One Customer)', link: 'hyperf/web/lock/queue'},
]},
{text: '🏢 Offices', collapsible: true, children: [
{'text': 'Export Excel', link: 'hyperf/web/office/excel'},
{'text': 'Export Csv', link: 'hyperf/web/office/csv'},
]},
{text: '↔️ Encrypt', collapsible: true, children: [
{'text': 'AES', link: 'hyperf/web/convert/aes'},
{'text': 'RSA', link: 'hyperf/web/convert/rsa'},
{'text': 'AWS4', link: 'hyperf/web/convert/aws4'},
{'text': 'RC4', link: 'hyperf/web/convert/rc4'},
]},
{text: '🍪 Login', collapsible: true, children: [
{'text': 'JWT', link: 'hyperf/web/login/jwt'},
{'text': 'Cookie', link: 'hyperf/web/login/cookie'},
{'text': 'Session', link: 'hyperf/web/login/session'},
{'text': 'Q&A', link: 'hyperf/web/login/qa'},
]},
{text: '📀 Servers', collapsible: true, children: [
{'text': 'Server Notice', link: 'hyperf/web/deployment/description'},
{'text': 'Deployment Process', link: 'hyperf/web/deployment/detail'},
]},
]

prev: /us/hyperf/web/convert/rc4
next: /us/hyperf/web/login/cookie
sidebarDepth: 3
---

# Jwt

目录

[[toc]]

## Basic Concepts

### What is JWT

> JWT: JSON WEB TOKEN

JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information as a JSON object between parties. The information can be verified and trusted because it is digitally signed.

### Structure and Components

> A standard JWT consists of three parts: `Header`, `Payload`, and `Signature`. These three parts are concatenated with a `.` separator. For example: `xxxx.yyyy.zzzz`.

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
Note, do not place sensitive information in the JWT's `payload` or `header` unless it is encrypted. This is because both the `payload` and `header` can be decoded.
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

::: tip
The signature is used to verify whether the message has been altered during transmission. Additionally, for a `token` signed with a private key, it can also verify whether the sender of the `JWT` is indeed the claimed sender.
:::

The algorithm declared in the `Header` is used to sign (encrypt) the `Header` and `Payload`, resulting in the `Signature`. For example:
> hash_hmac('SHA256', 'xxxx.yyyy', 'SECRET')

---

### Exp

```shell:no-line-numbers
curl --location 'http://127.0.0.1:9501/auth/sync/test' \
--header 'Authorization: Bearer xxxx.yyyy.zzzz'
```

## Usage

### Install Dependencies

> [Standard Library Address](https://packagist.org/packages/firebase/php-jwt)

```shell:no-line-numbers
composer require firebase/php-jwt
```

### Code

::: details Detail
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

### Middleware Validation

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

## Notes

- Do not add sensitive information to the `header` or `payload`. Instead, include important and frequently used data.
- The validity period of a `JWT` should generally be one or a few hours, and it is best not to set a very long validity period.
- In principle, it should only be validated, not stored. To address the issue of `JWT` not being able to expire proactively, I have implemented storage (blacklist and whitelist). Otherwise, it would be no different from a `Session`, but this approach does not rely on `Cookie`.