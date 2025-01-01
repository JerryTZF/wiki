---
sidebar: [
{text: '🖼 图像相关', collapsible: true, children: [
{'text': '二维码', link: 'hyperf/web/image/qrcode'},
{'text': '条形码', link: 'hyperf/web/image/barcode'},
{'text': '验证码', link: 'hyperf/web/image/captcha'},
]},
{text: '🔐 锁相关', collapsible: true, children: [
{'text': 'Redis分布式锁', link: 'hyperf/web/lock/redis'},
{'text': '数据库悲观锁', link: 'hyperf/web/lock/pessimism'},
{'text': '数据库乐观锁', link: 'hyperf/web/lock/optimistic'},
{'text': '队列(单个消费)', link: 'hyperf/web/lock/queue'},
]},
{text: '🏢 Office相关', collapsible: true, children: [
{'text': '数据导出Excel', link: 'hyperf/web/office/excel'},
{'text': '数据导出Csv', link: 'hyperf/web/office/csv'},
]},
{text: '↔️ 加解密', collapsible: true, children: [
{'text': 'AES', link: 'hyperf/web/convert/aes'},
{'text': 'RSA', link: 'hyperf/web/convert/rsa'},
{'text': 'AWS4', link: 'hyperf/web/convert/aws4'},
{'text': 'RC4', link: 'hyperf/web/convert/rc4'},
]},
{text: '🍪 登录相关', collapsible: true, children: [
{'text': 'JWT', link: 'hyperf/web/login/jwt'},
{'text': 'Cookie', link: 'hyperf/web/login/cookie'},
{'text': 'Session', link: 'hyperf/web/login/session'},
{'text': 'Q&A', link: 'hyperf/web/login/qa'},
]},
{text: '📀 服务部署', collapsible: true, children: [
{'text': '说明', link: 'hyperf/web/deployment/description'},
{'text': '部署流程', link: 'hyperf/web/deployment/detail'},
]},
]

prev: /hyperf/web/login/session
next: /hyperf/web/deployment/description
sidebarDepth: 3
---

# Q&A

目录
[[toc]]

## Cookie和Session迥异点

### 不同点
- Cookie的信息存储在客户端(一般指浏览器)，每次请求都会将这些信息通过Cookie这种特殊的参数携带到服务端。
- Session的信息存储在服务端，将Cookie作为媒介，标记一个唯一ID(SESSION_ID)，后续通过Cookie将该ID传输到服务端，解析对应的数据。
- Session可以存储 **敏感的**、**任意格式的**、**任意大小的**数据，因为数据是在服务端。
- Cookie只能存储 **4KB**、**非敏感的**、**ASCII编码的** 数据。
- Cookie一般一个站点上限150。
- Session一个会话可以存储几乎无限数据。

### 相同点

- 都依赖浏览器Cookie机制。
- 都存在跨域问题。客户端请求多个域名下的服务目前是很正常的情况。
- 都可以标记HTTP状态。

## 使用场景

我个人倾向于 `HTTP Server` 的 `API` 调用使用 `JWT` + `Redis存储`。因为不用区分客户端类型，不用依赖浏览器机制。

---

::: tip 😅
其实这些东西挺无聊的，没什么太多的意义。但是记录下就当填充下内容吧。
:::
