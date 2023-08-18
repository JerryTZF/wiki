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
{'text': '数据库乐观锁', link: '/zh/hyperf/web/lock/optimistic'},
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

prev: /zh/hyperf/web/lock/redis
next: /zh/hyperf/web/lock/optimistic
sidebarDepth: 3
---

# 数据库悲观锁

目录

[[toc]]

## 几个核心关键点

### 1、`autocommit` 和 `begin` 、`start transaction` 的关系
---
- *他们的作用范围不一样：`autocommit` 是数据库innodb引擎级别的属性，相当于 `begin` 、`start transaction` 是全局有效。
一旦使用 `SET AUTOCOMMIT=0` 禁止自动提交，则在这个数据库内部的所有事务都不会自动提交，除非你手动的为每一个事务执行了 `commit` 或者
`rollback` 语句；而 `start transaction` 和 `begin/commit` 只能控制某一个事务。*
---
- *优先级不一样：`start transaction` 和 `begin/commit` 优先级是高于 `autocommit` 的。即：
即使 `autocommit=1`，如果语句显示声明开启事务 (`begin/commit`)，那么依旧需要自己手动提交或回滚。*
---
::: tip
细节请参考： [官方说明-commit](https://dev.mysql.com/doc/refman/8.0/en/commit.html)、[官方说明-autocommit](https://dev.mysql.com/doc/refman/8.0/en/innodb-autocommit-commit-rollback.html)

---

![](https://img.tzf-foryou.xyz/img/20230818180336.png)
:::

---

### 2、`for update` 和 `lock in share mode` 区别

---

- 共享锁(`lock in share mode`)：当上锁之后，另一个线程只可以读，不可以修改。
- 排它锁(`select ... for update`)：上锁之后，另一个线程不可以读和修改。

> 需要注意的是：若一个线程for update执行锁住某行数据，其他线程读取的时候，sql里没有for update，则可以正常读取。

---

::: warning
for update 的条件如果没有命中索引，则会锁表！！！\
下面表是命中 ***不同类型索引*** 和 ***查询结果是否为空*** 的锁结果。

---

|   主键索引 |      普通索引      |  结果集是否为空 | 结果 |
|----------|:-------------:|------:|------:|
|  :white_check_mark: |  :x: | :x: |    `row lock`    |
| :x: |    :white_check_mark:   |   :x: | `row lock` |
| :x: |:x: |    :x: | `table lock` |

:::

---

### 3、使用范围

---

- 必须是 `mysql`的 `innoDb` 表。
- 必须开启 `transaction` 事务。

