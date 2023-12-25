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

prev: /zh/hyperf/web/login/jwt
next: /zh/hyperf/web/login/session
sidebarDepth: 3
---

# Cookie

目录
[[toc]]

## 作用

- 辅助WEB请求(Http)保持状态。
- 浏览器本地存储。

## 流程及原理

![](https://img.tzf-foryou.xyz/img/20231224230649.png)

## 设置cookie

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

## 使用场景

- 会话管理(cookie除了会话管理还有什么应用场景)
- 个性化设置(前端一些无需与后端交互的配置信息)
- 浏览器用户行为跟踪

## 注意事项

- cookie依赖于浏览器机制，对于移动端无效。一般移动端API也不依赖于Cookie做会话。😅
- `expire` 不设置则关闭浏览器就会删除cookie。
- 跨域携带cookie设置 `Access-Control-Allow-Origin` 为 `*`，并没有什么用，真的要跨域，应该设置为对应的网址。
- **cookie的值都是明文的，所以一般都会将值进行加密**。
- 每个站点最多 `150` 个 cookie 上限。
- cookie上限为4KB，也就是 `Value` 上限是4KB。

---

## 安全问题

### CSRF攻击

利用未失效的Cookie进行敏感操作。例如：
1. 登录A网站(浏览器设置cookieA)，进行敏感操作：`GET https://a.com/transfer/1000`;
2. 点击B网站钓鱼链接 `<img src="https://a.com/transfer/9999">`
3. 浏览器会自动带上A网站的cookieA，进行调用，那么就出现风险。


---

::: warning 【注意】
对于跨域携带 `cookie` 多说一句：cookie新增了 `sameSite` 属性。
SameSite的值分成三种Strict, Lax, None。
1.  **Strict**: 完全禁止第三方 Cookie，跨站点时，任何情况下都不会发送 Cookie。
2.  **Lax**: 允许部分第三方请求携带 Cookie。
3.  **None**: 无论是否跨站都会发送 Cookie。

总结：SameSite为None时，Secure必须为true，也就是此时你必须使用https请求。 到了这一步，你可以将自己的跨域请求携带上cookie了。
:::
