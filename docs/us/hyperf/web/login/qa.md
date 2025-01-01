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

prev: /us/hyperf/web/login/session
next: /us/hyperf/web/deployment/description
sidebarDepth: 3
---

# Q&A

Index
[[toc]]

## Differences Between Cookie and Session

### Differences
- Cookie stores information on the client-side (typically in the browser). Each request sends this information to the server through a special parameter, the Cookie.
- Session stores information on the server-side. It uses the Cookie as a medium to mark a unique ID (SESSION_ID), which is then sent back to the server through the Cookie to retrieve the corresponding data.
- Session can store **sensitive**, **arbitrary format**, and **large size** data, as the data is stored on the server.
- Cookie can only store **4KB**, **non-sensitive**, and **ASCII-encoded** data.
- Typically, a site can store a maximum of 150 cookies.
- A session can store nearly unlimited data.

### Similarities

- Both rely on the browser's Cookie mechanism.
- Both have cross-origin issues. It is common for clients to request services from multiple domains.
- Both can be used to track HTTP states.

## Use Case

Personally, I prefer using `JWT` + `Redis storage` for `API` calls in `HTTP Servers`, as it eliminates the need to differentiate between client types and does not rely on the browser mechanism.

---

::: tip 😅
Actually, these things are quite boring and don't have much significance. But I'll record them just to fill up the content.
:::
