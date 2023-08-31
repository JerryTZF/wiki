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
]

prev: /zh/hyperf/web/lock/redis
next: /zh/hyperf/web/lock/optimistic
sidebarDepth: 3
---

# 数据库悲观锁

目录

[[toc]]

## 一、几个核心关键点

### 1、`autocommit` 和 `begin` 、`start transaction` 的关系
---
- *作用范围不一样：`autocommit` 是数据库innodb引擎级别的属性，相当于 `begin` 、`start transaction` 是全局有效。
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

---

## 二、构建数据库表

### 1、创建表

---

> 商品表

```sql:no-line-numbers
CREATE TABLE `hyperf`.`goods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '商品名称',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '商品价格',
  `stock` int unsigned NOT NULL DEFAULT '0' COMMENT '库存',
  `version` int unsigned NOT NULL DEFAULT '0' COMMENT '乐观锁版本控制',
  `brand` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '品牌',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品表';
```
---

> 流水表

```sql:no-line-numbers
CREATE TABLE `hyperf`.`orders`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `gid` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品ID',
  `order_id` varchar(64) NOT NULL DEFAULT '' COMMENT '订单ID',
  `number` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '购买数量',
  `money` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `customer` varchar(32) NOT NULL DEFAULT '' COMMENT '购买人',
  `create_time` datetime(0) NULL,
  `update_time` datetime(0) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `order_index`(`order_id`) USING BTREE,
  INDEX `customer_index`(`customer`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '购买流水表';
```

---

### 2、插入测试数据

```sql:no-line-numbers
INSERT INTO `hyperf`.`goods`(`name`, `price`, `stock`, `brand`, `create_time`, `update_time`) VALUES ('iphone14 pro', 8999.00, 100, '苹果', '2023-08-19 12:25:58', '2023-08-19 12:26:00')
```

---

## 三、测试过程

### 1、代码
::: details 查看代码
```php:no-line-numbers
#[GetMapping(path: 'pessimism/write/lock')]
public function pessimismWriteLock(): array
{
    $gid = $this->request->input('gid', 1);
    $num = $this->request->input('num', 1);
    try {
        Db::beginTransaction();
        /** @var Goods $goodInfo */
        $goodInfo = Goods::where(['id' => $gid])->lockForUpdate()->firstOrFail();
        sleep(5); // 模拟长事务
        if ($goodInfo->stock > 0 && $goodInfo->stock >= $num) {
            (new Orders([
                'gid' => $goodInfo->id,
                'order_id' => Str::random() . uniqid(),
                'number' => $num,
                'money' => $goodInfo->price * $num,
                'customer' => 'Jerry',
            ]))->save();

            $goodInfo->stock = $goodInfo->stock - $num;
            $goodInfo->save();

            Db::commit();
            return $this->result->getResult();
        }

        Db::rollBack();
        return $this->result->setErrorInfo(
            ErrorCode::STOCK_ERR,
            ErrorCode::getMessage(ErrorCode::STOCK_ERR, [$goodInfo->name])
        )->getResult();
    } catch (Throwable $e) {
        Db::rollBack();
        return $this->result->setErrorInfo($e->getCode(), $e->getMessage())->getResult();
    }
}
```
:::

---

### 2、并发调用

````shell:no-line-numbers
ab -n 30 -c 5 http://127.0.0.1:9501/test/pessimism/write/lock
````

---

### 3、查看事务和锁情况

---

::: tip 【额外补充】
> 通过 `information_schema.INNODB_TRX` 表来查看事务和锁的情况。`information_schema.INNODB_TRX` 字段说明：

---
![](https://img.tzf-foryou.xyz/img/20230819151336.png)

---
:::

---

```sql:no-line-numbers
// 查看事务情况
select * from information_schema.innodb_trx
```

---

![](https://img.tzf-foryou.xyz/img/20230819152032.png)

---

## 四、注意

- 示例中的并发为5，当更大的时候，会出现死锁。
- 锁定的条件一定要注意，必须走索引，最好走主键索引，因为没有命中索引会锁表。
- 当显式事务锁住某行数据时，该行数据其他的 非显式 `update` 操作也会锁等待，因为 `update` 单个SQL也是事务。不要以为其他 `update` 没在 `BEGIN` `COMMIT` 中就不会等待。
- 最好不要使用 `MySQL` 进行显式锁操作。数据库应该更专注作为数据存储的存在。

---

## 五、使用场景

- **并发较小** 、 **相对独立** 、**一致性较强** 的数据库操作。
