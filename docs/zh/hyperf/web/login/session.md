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
]

prev: /zh/hyperf/web/login/cookie
next: /zh/hyperf/web/login/qa
sidebarDepth: 3
---

# Session

目录
[[toc]]

## 作用

- 辅助WEB请求(Http)保持状态。 

## 流程及原理

![](https://img.tzf-foryou.xyz/img/20231225161223.png)

## 设置session

### 安装依赖包

> [标准库地址](https://packagist.org/packages/hyperf/session)

```shell:no-line-numbers
composer require hyperf/session
```
### 发布配置

> php bin/hyperf.php vendor:publish hyperf/session

```php:no-line-numbers
<?php

declare(strict_types=1);
use Hyperf\Session\Handler;

return [
    'handler' => Handler\FileHandler::class, // 驱动类型
    'options' => [
        'connection' => 'default',
        'path' => BASE_PATH . '/runtime/session',
        'gc_maxlifetime' => 1200,
        'session_name' => 'HYPERF_SESSION_ID',
        'domain' => null,
        'cookie_lifetime' => 5 * 60 * 60,
        'cookie_same_site' => 'lax',
    ],
];

```

### 添加中间件

> config/autoload/middlewares.php

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'http' => [
        ...
        // Session中间件(官方)
        Hyperf\Session\Middleware\SessionMiddleware::class,
        ...
    ],
];

```

### 使用示例

```php:no-line-numbers
#[GetMapping(path: 'session/set')]
public function setSession(): array
{
    $this->session->set('ttt', 'xxx');
    return $this->result->getResult();
}

#[GetMapping(path: 'session/get')]
public function getSession(): array
{
    $session = $this->session->all();
    return $this->result->setData($session)->getResult();
}
```

## 注意事项

- Session 依赖 Cookie 机制，如果 Cookie 禁用，Session无法正常使用(Session将Cookie当做传输SESSION_ID的媒介)。
- 每个请求都会设置set-cookie，但是同一个会话的SESSION_ID不会变化。
- 对于使用负载均衡的集群服务，应该将Session进行中心化存储，否则会出现重复创建Session和Session丢失问题。
- 同样会出现跨域问题，参见[Cookie跨域问题](/zh/hyperf/web/login/cookie.html#csrf攻击)

---

::: warning 【注意】
session和jwt(token)本质上都是颁发一个标识，然后客户端携带标识进行判断。但是侧重点不一样：\
session是存储，拿到标识后去判断是否存储、获取存储的数据。\
token是算法计算验证，一般情况下不存储，验证通过即认为合法请求。

**时间** 和 **空间** 的博弈问题。
:::