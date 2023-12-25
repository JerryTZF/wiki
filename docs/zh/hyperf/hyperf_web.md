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

sidebarDepth: 3
---

# web常规使用

## 说明

::: tip 【说明】
这里主要列举我开发(WEB)过程中一些常规的操作，和一些自己封装的组件。都是基于 **[Hyperf](https://hyperf.wiki/3.0/)** 框架 。\
另外，`Hyperf` 是基于 `Swoole` 生命周期，这里 `Swoole` 的基础知识非常重要，请***务必仔细*** 阅读[基础部分](https://wiki.swoole.com/#/learn)。

> **基于 <Badge type="tip" text="Hyperf v3.x" vertical="middle" />** 

> 所有的代码示例均在 [这里](https://github.com/JerryTZF/hyperf-v3/tree/main/app) 。
:::

---

## API接口说明

::: tip 【注意】
个人服务器演示所用，请勿压测，谢谢。 🙏 \
API会及时更新变动，请以最新为准。
> 地址：[接口调用地址](https://api.tzf-foryou.xyz/swagger/Hyperf-Wiki.html)
:::

> Http状态码说明：

:::: code-group
::: code-group-item 200
```text:no-line-numbers
业务正常或者业务异常, 服务此时正常服务
```
:::
::: code-group-item 422
```text:no-line-numbers
表单验证不通过。
```
:::
::: code-group-item 401
```text:no-line-numbers
权限验证不通过。
```
:::
::: code-group-item 500
```text:no-line-numbers
服务器异常，但是仍然可以提供服务，不影响其他服务调用。
```
:::
::::

--- 

## 补充

::: warning ￣□￣｜｜
持续施工 :construction:
1. 计划补齐三方(微信、支付宝、阿里云等)的对接使用示例。
2. 后续会新增常用的业务功能操作。
3. 持续勘误。
:::