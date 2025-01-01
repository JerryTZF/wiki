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

prev: /hyperf/web/lock/redis
next: /hyperf/web/lock/optimistic
sidebarDepth: 3
---

# 数据库悲观锁

目录

[[toc]]

## 几个核心关键点

### `autocommit` 和 `begin` 、`start transaction` 的关系
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

### 排它锁和共享锁区别

- 共享锁 `lock in share mode` ：当上锁之后，另一个线程只可以读，不可以修改。
- 排它锁 `select ... for update` ：上锁之后，另一个线程不可以读和修改。

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

### 使用范围

- 必须是 `mysql`的 `innoDb` 表。
- 必须开启 `transaction` 事务。

---

## 使用

### 共享锁和悲观锁代码示例

::: tabs
@tab 排它锁控制器
```php:no-line-numbers
/**
 * 使用悲观锁(排它锁)创建订单.
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'pessimism/for_update')]
#[Scene(scene: 'create_order')]
public function createOrderByForUpdate(LockRequest $request): array
{
    $gid = intval($request->input('gid'));
    $num = intval($request->input('number'));
    $uid = $this->jwtPayload['data']['uid'];
    $orderNo = $this->service->createOrderWithForUpdate($uid, $gid, $num);

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
@tab 排它锁逻辑
```php:no-line-numbers
/**
 * 悲观锁创建订单(排它锁).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithForUpdate(int $uid, int $gid, int $number = 1): string
{
    // 开启事务
    Db::beginTransaction();
    try {
        $orderNo = '';

        /** 加上排它锁 @var Goods $goodInfo */
        $goodInfo = Goods::query()->where(['id' => $gid])->lockForUpdate()->first();
        // 商品不存在
        if ($goodInfo === null) {
            throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_NOT_FOUND));
        }
        // 库存不足
        if ($goodInfo->stock < $number) {
            throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_STOCK_EMPTY, [$goodInfo->name]));
        }
        // 创建订单
        $orderNo = Math::getUniqueId();
        (new Orders([
            'uid' => $uid,
            'gid' => $gid,
            'order_no' => $orderNo,
            'number' => $number,
            'payment_money' => Math::mul($goodInfo->price, $number),
        ]))->save();

        // 扣减库存
        $goodInfo->stock = $goodInfo->stock - $number;
        $goodInfo->save();
        Db::commit();
    } catch (Throwable $e) {
        Db::rollBack();
    }

    if ($orderNo === '') {
        throw new BusinessException(...self::getErrorMap(ErrorCode::STOCK_EMPTY));
    }

    return $orderNo;
}
```
@tab 共享锁控制器
```php:no-line-numbers
/**
 * 使用悲观锁(共享锁)创建订单.
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'pessimism/share_mode')]
#[Scene(scene: 'create_order')]
public function createOrderByShareMode(LockRequest $request): array
{
    $gid = intval($request->input('gid'));
    $num = intval($request->input('number'));
    $uid = $this->jwtPayload['data']['uid'];
    $orderNo = $this->service->createOrderWithShareMode($uid, $gid, $num);

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
@tab 共享锁逻辑
```php:no-line-numbers
/**
 * 悲观锁创建订单(共享锁).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithShareMode(int $uid, int $gid, int $number = 1): string
{
    // 开启事务
    Db::beginTransaction();
    try {
        /** 加上共享锁 @var Goods $goodInfo */
        $goodInfo = Goods::query()->where(['id' => $gid])->sharedLock()->first();
        // 商品不存在
        if ($goodInfo === null) {
            throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_NOT_FOUND));
        }
        // 库存不足
        if ($goodInfo->stock < $number) {
            throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_STOCK_EMPTY, [$goodInfo->name]));
        }
        // 创建订单
        $orderNo = Math::getUniqueId();
        (new Orders([
            'uid' => $uid,
            'gid' => $gid,
            'order_no' => $orderNo,
            'number' => $number,
            'payment_money' => Math::mul($goodInfo->price, $number),
        ]))->save();

        // 扣减库存
        $goodInfo->stock = $goodInfo->stock - $number;
        $goodInfo->save();
        Db::commit();
    } catch (Throwable $e) {
        $orderNo = '';
        Db::rollBack();
    }

    if ($orderNo === '') {
        throw new BusinessException(...self::getErrorMap(ErrorCode::STOCK_EMPTY));
    }

    return $orderNo;
}
```
:::

---

### 注意事项

::: warning 【注意】
- 锁定的条件一定要注意，必须走索引，最好走主键索引，因为没有命中索引会锁表。
- 当 **显式事务** 锁住某行数据时，该行数据其他的 **非显式** `update` 操作也会锁等待，因为 `update` 单个SQL也是事务。不要以为其他 `update` 没在 `BEGIN` `COMMIT` 中就不会等待。
- 最好不要使用 `MySQL` 进行显式锁操作。数据库应该更专注作为数据存储的存在。
:::

## 查看事务和锁

**查看事务和锁情况**

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

## 使用场景

- **并发较小** 、 **相对独立(尽可能锁住的行不被其他业务更新)** 、**一致性较强** 的数据库操作。
