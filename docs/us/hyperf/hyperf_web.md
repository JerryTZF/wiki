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

sidebarDepth: 3
---

# web

目录
[[TOC]]

## Illustrate

::: tip

Here, I mainly list some common operations during my web development process, 
as well as some self-packaged components (scaffolding). 
All of these are based on the **[Hyperf](https://hyperf.wiki/3.0/)**. 
Additionally, `Hyperf` is based on the `Swoole lifecycle`, 
so the basic knowledge of `Swoole` is very important. Please ***make sure*** to read the [basics section](https://wiki.swoole.com/#/learn) carefully.

> Based on <Badge type="tip" text="Hyperf v3.x" vertical="middle" />. All code examples are [here](https://github.com/JerryTZF/hyperf-v3/tree/main/app) .

:::

---

## API Interface Documentation

::: tip
For personal server demonstration purposes, please do not perform stress tests. Thank you. 🙏
> Address：[API](https://api.tzf-foryou.xyz/swagger/Hyperf-Wiki.html)
:::

**Http状态码说明**：

::: tabs
@tab 200
```text:no-line-numbers
Business is normal or business is abnormal, the service is still  
functioning normally.
```
@tab 422

```text:no-line-numbers
Form validation failed.
```
@tab 401
```text:no-line-numbers
Permission validation failed.
```
@tab 500
```text:no-line-numbers
Server error, but it can still provide services without affecting 
other service calls.
```
:::

--- 

## Supplement

::: warning ￣□￣｜｜
Ongoing construction :construction:
1. Plan to complete the integration usage examples for third parties (WeChat, Alipay, Alibaba Cloud, etc.).
2. Will add commonly used business functionality operations in the future.
3. Continuous errata correction.
:::