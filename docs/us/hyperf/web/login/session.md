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

prev: /us/hyperf/web/login/cookie
next: /us/hyperf/web/login/qa
sidebarDepth: 3
---

# Session

Index
[[toc]]

## Purpose

- Assists in maintaining state for web requests (HTTP).

## Process and Principle

![](https://img.tzf-foryou.xyz/img/20231225161223.png)

## Setting up Session

### Install Dependencies

> [Standard Library Address](https://packagist.org/packages/hyperf/session)

```shell:no-line-numbers
composer require hyperf/session
```
### Publish Configuration

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

### Add Middleware

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

### Example Usage

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

## Considerations

- Session relies on the Cookie mechanism. If cookies are disabled, Session will not work properly (Session uses cookies as a medium to transmit the SESSION_ID).
- Each request will set a `set-cookie` header, but the SESSION_ID for the same session will not change.
- For clustered services using load balancing, Sessions should be centrally stored to prevent issues with duplicate session creation and session loss.
- Cross-origin issues can also arise. Refer to [Cross-origin](/us/hyperf/web/login/cookie.html#csrf攻击)

---

::: warning
Sessions and JWT (tokens) essentially issue an identifier, and the client carries the identifier for validation. However, the focus is different: \
Session stores the identifier and checks whether the identifier is stored and retrieves stored data. \
Token uses algorithmic validation and is generally not stored; if validation passes, it is considered a legitimate request.

**Time** and **Space** are the trade-off issues. 
:::