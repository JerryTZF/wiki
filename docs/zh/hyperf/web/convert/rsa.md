---
sidebar: [
{text: '图像相关', collapsible: true, children: [
{'text': '二维码', link: '/zh/hyperf/web/image/qrcode'},
{'text': '条形码', link: '/zh/hyperf/web/image/barcode'},
{'text': '验证码', link: '/zh/hyperf/web/image/captcha'},
]},
{text: '锁相关', collapsible: true, children: [
{'text': 'Redis分布式锁', link: '/zh/hyperf/web/lock/redis'},
{'text': '数据库悲观锁', link: '/zh/hyperf/web/lock/pessimism'},
{'text': '乐观锁', link: '/zh/hyperf/web/lock/optimistic'},
{'text': '队列(单个消费)', link: '/zh/hyperf/web/lock/queue'},
]},
{text: 'Office相关', collapsible: true, children: [
{'text': '数据导出Excel', link: '/zh/hyperf/web/office/excel'},
{'text': '数据导出Csv', link: '/zh/hyperf/web/office/csv'},
]},
{text: '加解密', collapsible: true, children: [
{'text': 'AES', link: '/zh/hyperf/web/convert/aes'},
{'text': 'RSA', link: '/zh/hyperf/web/convert/rsa'},
{'text': 'AWS4', link: '/zh/hyperf/web/convert/aws4'},
{'text': 'RC4', link: '/zh/hyperf/web/convert/rc4'},
]},
{text: 'GuzzleHttp', 'link': '/zh/hyperf/web/guzzle'}
]

prev: /zh/hyperf/web/convert/aes
next: /zh/hyperf/web/convert/aws4
sidebarDepth: 3
---

# RSA

目录

[[toc]]

## 核心概念

***1、对称加密***

> 通信双方持有同一个 `秘钥` 使用 `算法` 对传输的数据进行加解密。 
> 常见的算法有：`AES`、`DES`、`RC4`等。
---
***2、非对称加密***
> 非对称加密算法中信息的发送方和接收方都分别有两个密钥，其中分别为 `私钥` 和 `公钥`。`私钥` 
> 为数据的发送方持有，`公钥`可以公开。常见的算法为 `RSA`。
---
***3、RSA算法规则***
> - 私钥加密的数据只有对应的公钥可以解密，公钥加密的数据只有对应的私钥可以解密。
> - 私钥可以生成公钥，但是公钥无法生私钥。
> - 「公钥」对数据加密，用「私钥」解密，称为 ***`加密`*** ; 「私钥」对数据加密，用「公钥」解密，称为 ***`签名`***。
 
---
***4、摘要***
> 对一份数据，进行一个***单向***的 `Hash` 函数，生成一个固定长度的 `Hash` 值，这个值就是这份数据的摘要，也称为指纹。
> 且数据有任何变动，最终的 `Hash` 值就会不一致。
---
***5、数字签名***
> 用于保证数据完整性、合法数据源的签名字段。即保证：数据不允许被篡改，不允许其他人假冒自己传输数据。
> `RSA` 的私钥签名保证其不可冒充。
---
***6、数字证书***

> 数字签名主要用来验证数据完整性和认证数据来源，而数字证书主要用来安全地发放公钥。 数字证书主要包含三个部分：用户的信息、用户的公钥和 CA 对该证书实体信息的签名

## 通信过程

***假设 `A`和`B`想要安全的通信：***

> 1、**A** 生成一对秘钥对：`privateKeyA`、`publicKeyA`；**B** 生成一对秘钥对：`privateKeyB`、`publicKeyB`。\
> 2、**A** 发放 `publicKeyA` 给到 **B**，**B** 发放 `publicKeyB` 给到 **A**。此时 **A** 拥有 `privateKeyA`和`publicKeyB`，**B** 拥有
`privateKeyB`和`publicKeyA`。\
> 3、**A** 对 `明文A` 进行 ***摘要计算***，得到 `DigestA` (防止数据篡改)，此时再用 `privateKeyA` 对 `DigestA` 进行 ***加签*** 
得到 `SignA` (确保是**A**发送的数据)，同时 **A** 用 `privateKeyA` 对 `明文A` 加密得到 `密文A`。此时将 `密文A` 和 `SignA` 发送给 **B**。\
> 4、**B** 收到 `密文A` 和 `SignA` 后，使用 `publicKeyA` 对 `密文A` 解密得到 `明文A` ，对 `明文A` 进行 ***摘要计算*** 得到 `DigestB`。
> 同时使用 `publicKeyA` 对 `SignA` 进行解密得到 `DigestA`，比较 `DigestA` 和 `DigestB` 是否相同。

---

::: tip 【流程图】
![](https://img.tzf-foryou.xyz/img/20230825154528.png)
:::

## 封装工具类