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

prev: /zh/hyperf/api/login
next: /zh/hyperf/api/role

sidebarDepth: 3
---

# 角色相关

目录
[[toc]]

::: tip 【说明】
- 角色相关接口全部需要携带 `jwt`。
- 部分接口需要 `Super Admin` 才可访问。
:::

## 角色列表

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 获取全部或指定的角色列表(携带权限节点ID)
Method: GET
Uri: /role/list
Content-Type: application/json
Authorization: Bear JwtString
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
role_name: 角色名称;非必填;字符串;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
// 获取全部角色不传参数即可.
{
    "role_name" : "管理员"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": [
        {
            "id": 1, // 角色ID
            "role_name": "超级管理员", // 角色名称
            "super_admin": "yes", // 是否超管
            "auth_id": [], // 权限节点IDs ["1", "2", "3" ...]
            "node_id": [], // 页面节点IDs ["1", "2", "3" ...]
        },
        {
            "id": 2,
            "role_name": "管理员",
            "super_admin": "no",
            "auth_id": [],
            "node_id": []
        }
    ]
}
```
:::
::: code-group-item 失败示例
```json:no-line-numbers
{
    "code": 50009,
    "msg": "jwt 缺失",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location --request GET 'https://domain.com/role/list' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer JwtString' \
--data '{
    "role_name" : "管理员"
}'
```
:::
::::


## 添加角色

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 添加角色(默认角色会带有默认的权限节点)
Method: POST
Uri: /role/add
Content-Type: application/json
Authorization: Bear JwtString
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
role_name: 角色名称;必填;字符串;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "role_name" : "管理员"
}
```
:::
::: code-group-item 成功示例
```json:no-line-numbers
// 无论该角色是否存在, 均为200
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
    "code": 50009,
    "msg": "jwt 缺失",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/role/add' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer JwtString' \
--data '{
    "role_name": "管理员"
}'
```
:::
::::

## 修改角色基本信息

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 修改角色基本信息(默认角色不允许修改+超管不允许禁用)
Method: POST
Uri: /role/update
Content-Type: application/json
Authorization: Bear JwtString
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
role_id: 角色ID;必填;整型;
role_name: 角色名称;非必填;字符串;
status: 状态;非必填;字符串('active', 'delete', 'pause');
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "role_id": 4,
    "role_name": "备胎乙",
    "status": "active"
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
    "code": 50012,
    "msg": "默认角色不允许变更",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/role/update' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer JwtString' \
--data '{
    "role_id": ,
    "role_name": "备胎",
    "status": "delete"
}'
```
:::
::::


## 添加权限节点至角色

:::: code-group
::: code-group-item 基础参数
```text:no-line-numbers
Description: 绑定权限节点到指定角色
Method: POST
Uri: /role/bind
Content-Type: application/json
Authorization: Bear JwtString
```
:::
::: code-group-item 请求参数
```text:no-line-numbers
role_id: 角色ID;必填;整型;
auth_id: 权限节点IDs;必填;数组;
```
:::
::: code-group-item 请求示例
```json:no-line-numbers
{
    "role_id": 3,
    "auth_id": [1,3,3,5,6,20,99]
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
    "code": 50011,
    "msg": "部分或全部节点不存在",
    "status": false,
    "data": []
}
```
:::
::: code-group-item cURL
```shell:no-line-numbers
curl --location 'https://domain.com/role/bind' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer JwtString' \
--data '{
    "role_id": 3,
    "auth_id": [1,3,3,5,6,20,99]
}'
```
:::
::::