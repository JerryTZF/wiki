---
sidebar: [
{text: '🚀 接口文档', collapsible: true, children: [
{'text': '登录相关', link: '/zh/hyperf/api/login'},
{'text': '角色相关', link: '/zh/hyperf/api/role'},
]},
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
]

prev: /zh/hyperf/hyperf_web
next: /zh/hyperf/api/role

sidebarDepth: 3
---

# 登录相关

目录
[[toc]]

::: tip 说明
- 登录相关不会进行权限验证。
- 短信并发量为 `1`，请勿大量大调用。且验证码失效期内，不允许重复发送。
:::

## 用户注册

> 【注意】注册时需要发酸短信验证。

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 注册可后续调用其他接口
Method: POST
Uri: /login/register
Content-Type: application/json
Authorization: None
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
account: 用户名;必填;字符串;
password: 密码;必填;字母数字下划线;
password_confirmation: 确认密码;必填;字母数字下划线;
phone: 手机号;必填;字符串;
code: 验证码;必填;字符串
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "account": "Foo",
    "password": "1234567",
    "password_confirmation": "1234567",
    "phone": "13939265073",
    "code": "123321"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": false,
    "data": []
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 9906,
    "msg": "数据验证失败，原因如下：手机验证码必填",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/login/register' \
--header 'Content-Type: application/json' \
--data '{
    "account": "Foo",
    "password": "1234567",
    "password_confirmation": "1234567",
    "phone": "13939265073",
    "code": "123321"
}'
```
:::
::::

---

## 登录(获取Jwt)

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 用户登录,获取Jwt
Method: POST
Uri: /login/Jwt/get
Content-Type: application/json
Authorization: None
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
account: 用户名;必填;字符串;
pwd: 密码;必填;字母数字下划线;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "account": "Foo",
    "pwd": "123123"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": {
        "jwt": "xxx",
        "refresh_jwt": "xxx"
    }
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 50006,
    "msg": "用户 Foo 未注册或者密码错误",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/login/jwt/get' \
--header 'Content-Type: application/json' \
--data '{
    "account": "Foo",
    "pwd": "123321"
}'
```
:::
::::

---

## 发送短信验证码

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 发送短信验证码, 5分钟有效
Method: POST
Uri: /login/send/sms
Content-Type: application/json
Authorization: None
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
phone: 手机号;必填;字符串;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "phone": "13911119999"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": {
        "code": "379973"
    }
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 50017,
    "msg": "短信还在有效期内, 请勿重复发送",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/login/send/sms' \
--header 'Content-Type: application/json' \
--data '{
    "phone": "13911119999"
}'
```
:::
::::

## 刷新Jwt

> 使用 `登录(获取Jwt)` 返回的 `refresh_jwt` 进行获取新的 jwt

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 使用refresh_jwt获取新的jwt，且无需再次登录
Method: POST
Uri: /login/jwt/refresh
Content-Type: application/json
Authorization: None
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
jwt: refresh_jwt;必填;字符串;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "jwt": "{{refresh_jwt}}"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": "new jwt token."
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 9908,
    "msg": "认证失败：refresh jwt expred or others",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/login/jwt/refresh' \
--header 'Content-Type: application/json' \
--data '{
    "jwt": "refresh jwt"
}'
```
:::
::::

## 使Jwt失效

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 使用已经颁发的 jwt 失效
Method: POST
Uri: /login/jwt/deactivate
Content-Type: application/json
Authorization: None
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
jwt: 颁发的jwt;必填;字符串;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "jwt": "{{jwt}}"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": []
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 9908,
    "msg": "认证失败：Wrong number of segments",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/login/jwt/deactivate' \
--header 'Content-Type: application/json' \
--data '{
    "jwt": "{{jwt}}"
}'
```
:::
::::

## 获取Jwt状态

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 获取jwt的信息
Method: POST
Uri: /login/jwt/status
Content-Type: application/json
Authorization: None
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
jwt: 颁发的jwt;必填;字符串;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "jwt": "{{jwt}}"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": {
        "exp": 86233, // 还有${exp}秒失效
        "uid": 1, // 用户ID
        "jwt_data": {
            "uid": 1, // 用户ID
            "rid": [ // 角色ID列表
                "1",
                "3",
                "4"
            ]
        },
        "exp_date": "2023-12-17 17:35:20", // 失效日期
        "iat_date": "2023-12-16 17:35:20" // 颁发日期
    }
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 9908,
    "msg": "认证失败：Wrong number of segments",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/login/jwt/status' \
--header 'Content-Type: application/json' \
--data '{
    "jwt": "{{jwt}}"
}'
```
:::
::::




