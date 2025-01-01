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

prev: /us/hyperf/web/login/jwt
next: /us/hyperf/web/login/session
sidebarDepth: 3
---

# Cookie

Index
[[toc]]

## Purpose

- Assists in maintaining state for web requests (HTTP).
- Local storage in the browser.

## Process and Principle

![](https://img.tzf-foryou.xyz/img/20231224230649.png)

## Set Cookie

```php:no-line-numbers
// response中添加set-cookie头信息
// name=Jerry; expires=Sun, 24-Dec-2023 15:09:07 GMT; Max-Age=60; path=/test; domain=127.0.0.1; secure; httponly
#[GetMapping(path: 'cookie/set')]
public function setCookie(): ResponseInterface
{
    $cookie = new Cookie(
        name: 'name', // The name of the cookie
        value: 'Jerry', // The value of the cookie
        expire: time() + 60, // The time the cookie expires
        path: '/test', // The path on the server in which the cookie will be available on
        domain: '127.0.0.1', // The domain that the cookie is available to
        secure: true, // Whether the cookie should only be transmitted over a secure HTTPS connection from the client
        httpOnly: true, // Whether the cookie will be made accessible only through the HTTP protocol
        raw: false, // Whether the cookie value should be sent with no url encoding
        sameSite: null, // Whether the cookie will be available for cross-site requests
    );

    return $this->response->withCookie($cookie)->json([
        'code' => 200,
        'msg' => 'ok',
        'status' => true,
        'data' => [],
    ]);
}
```

## Use Cases

- Session management (In addition to session management, what other use cases are there for cookies)
- Personalization settings (Frontend configurations that do not require interaction with the backend)
- Browser user behavior tracking.

## Considerations

- Cookies depend on the browser mechanism, making them ineffective on mobile devices. Generally, mobile APIs do not rely on cookies for session management. 😅
- If `expire` is not set, cookies will be deleted when the browser is closed.
- Setting `Access-Control-Allow-Origin` to `*` does not work for cross-origin cookie handling. To truly support cross-origin, it should be set to the specific domain.
- **Cookie values are in plain text, so it is generally recommended to encrypt the values.**。
- Each site can store a maximum of `150` cookies.
- The cookie size limit is 4KB, meaning the `Value` can be up to 4KB.

---

## Security

### CSRF Attack

An attacker can perform sensitive operations using an unexpired cookie. For example:
1. Log in to site A (browser sets cookieA), and perform a sensitive operation:：`GET https://a.com/transfer/1000`;
2. Click on a phishing link from site B: `<img src="https://a.com/transfer/9999">`
3. The browser will automatically include cookieA from site A, performing the request, which creates a risk.


---

::: warning
Regarding cross-origin cookies: cookies have introduced a `sameSite` attribute.
The values of `SameSite` are divided into three types: `Strict`, `Lax`, and `None`.
1.  **Strict**: Completely prevents third-party cookies. It will not send cookies in any case during cross-site requests.
2.  **Lax**: Allows some third-party requests to carry cookies.
3.  **None**: Sends cookies regardless of whether it's a cross-site request.

Summary: When `SameSite` is set to `None`, `Secure` must be true, meaning you must use HTTPS for the request. With this configuration, you can carry cookies in cross-origin requests.
:::
