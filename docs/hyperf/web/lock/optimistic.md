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

prev: /hyperf/web/lock/pessimism
next: /hyperf/web/lock/queue
sidebarDepth: 3
---

# 乐观锁

目录

[[toc]]

::: tip 【概念】
乐观锁(`Compare and Swap`)是针对于悲观锁，即：认为数据不会被修改，不排他，只有在更新数据时，验证是否被其他行为改变，若改变则不进行变更，反之变更。
> 和数据库没有什么关系，乐观锁只是一种模式；数据库的 `for update` 、`lock in share mode` 等都是悲观锁范畴。

:::

---

## 条件乐观锁

> 在更新数据的时候，先判断下更新条件是否变更, 如果未变更, 则认为可以进行数据更新。

---

::: tabs
@tab 控制器示例
```php:no-line-numbers
/**
 * 创建订单(条件乐观锁).
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'optimistic/condition')]
#[Scene(scene: 'create_order')]
public function createOrderByCondition(LockRequest $request): array
{
    $gid = intval($request->input('gid'));
    $num = intval($request->input('number'));
    $uid = $this->jwtPayload['data']['uid'];
    $orderNo = $this->service->createOrderWithCondition($uid, $gid, $num);

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
@tab 逻辑示例
```php:no-line-numbers
/**
 * 根据库存条件创建订单(条件乐观锁).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithCondition(int $uid, int $gid, int $number = 1): string
{
    // 开启事务
    Db::beginTransaction();
    try {
        // 非常典型的库存安全检验, 适用于库存模型(也算是乐观锁的一种变形)
        // 标准的乐观锁会出现大量请求进来, 但是有很大可能只有其中的部分人操作成功, 虽然不会影响数据正确性, 但是效率较低.
        // 乐观锁的更新操作, 最好用主键或者唯一索引来更新, 这样是行锁, 否则更新时会锁表.
        // SQL: UPDATE `goods` SET `stock` = `stock` - 2, `goods`.`update_time` = '2023-12-12 22:50:06'
        // WHERE (`id` = '4') AND `stock` >= '2'
        $effectRows = Goods::query()
            ->where(['id' => $gid])
            ->where('stock', '>=', $number)
            ->decrement('stock', $number);
        if ($effectRows > 0) {
            $price = Goods::query()->where(['id' => $gid])->value('price');
            // 创建订单
            $orderNo = Math::getUniqueId();
            (new Orders([
                'uid' => $uid,
                'gid' => $gid,
                'order_no' => $orderNo,
                'number' => $number,
                'payment_money' => Math::mul($price, $number),
            ]))->save();
        } else {
            $orderNo = '';
        }
        // 提交事务
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

::: warning 【ABA问题】
- 当更新时比较数值是否变更的时候，可能会出现 `old -> new -> old` 然后进行更新，显然会有问题。
- 举例：`UPDATE Goods SET stock={$new_stock} WHERE id={$id} AND stock={$old_stock}`。此时，老库存数据其实会出现加加减减
又恢复到之前的数值，此时更新就数据错乱了。
:::

## 版本控制乐观锁

> 当判断条件是业务中的字段值时，可能会出现上述的 `ABA` 问题。那么可以引入一个额外的版本控制字段，专门来进行版本判断，这样不容易被业务数据干扰。

---

::: tabs
@tab 控制器示例
```php:no-line-numbers
/**
 * 创建订单(版本控制乐观锁).
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'optimistic/version')]
#[Scene(scene: 'create_order')]
public function createOrderByVersion(LockRequest $request): array
{
    $gid = intval($request->input('gid'));
    $num = intval($request->input('number'));
    $uid = $this->jwtPayload['data']['uid'];
    $orderNo = $this->service->createOrderWithVersion($uid, $gid, $num);

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
@tab 逻辑示例
```php:no-line-numbers
/**
 * 根据版本控制创建订单(版本控制乐观锁).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithVersion(int $uid, int $gid, int $number = 1): string
{
    /** @var Goods $goodInfo */
    $goodInfo = Goods::query()->where(['id' => $gid])->first();
    // 商品不存在
    if ($goodInfo === null) {
        throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_NOT_FOUND));
    }
    // 库存不足
    if ($goodInfo->stock < $number) {
        throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_STOCK_EMPTY, [$goodInfo->name]));
    }

    $effectRows = Goods::query()
        ->where(['id' => $gid, 'version' => $goodInfo->version]) // 如果该版本已经被修改,那么更新条件无法命中
        ->update([
            'stock' => $goodInfo->stock - $number,
            'version' => $goodInfo->version + 1, // 新版本
        ]);
    if ($effectRows > 0) {
        $price = Goods::query()->where(['id' => $gid])->value('price');
        // 创建订单
        $orderNo = Math::getUniqueId();
        (new Orders([
            'uid' => $uid,
            'gid' => $gid,
            'order_no' => $orderNo,
            'number' => $number,
            'payment_money' => Math::mul($price, $number),
        ]))->save();
    } else {
        // 一次没有抢到库存就被退出.
        $orderNo = '';
    }

    if ($orderNo === '') {
        throw new BusinessException(...self::getErrorMap(ErrorCode::STOCK_EMPTY));
    }

    return $orderNo;
}
```
:::

---

::: warning 【低命中率问题】
版本控制乐观锁虽然可以正确的处理数据，但是可能会出现：\
短时间的并发会只有少部分请求被真正处理，而其他的被丢弃。体现在业务层面就是：客户看到有库存，都去抢，返回自己没抢到，但是页面上的库存显示不为 **0** 的情况。
:::

## 自旋乐观锁

> 为了加强版本控制乐观锁的 "低命中率" 问题，我们可以让不同的线程进行自旋去尝试更新数据(一定要设置自旋逃离条件)，达到自旋逃离条件时，再确认更新失败。

---

::: tabs
@tab 控制器示例
```php:no-line-numbers
/**
 * 创建订单(版本控制+自旋).
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'optimistic/spin')]
#[Scene(scene: 'create_order')]
public function createOrderByVersionSpin(LockRequest $request): array
{
    $gid = intval($request->input('gid'));
    $num = intval($request->input('number'));
    $uid = $this->jwtPayload['data']['uid'];
    $orderNo = $this->service->createOrderWithSpin($uid, $gid, $num);

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
@tab 逻辑示例
```php:no-line-numbers
/**
 * 版本控制+自旋 创建订单(乐观锁+自旋).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithSpin(int $uid, int $gid, int $number = 1): string
{
    // 自旋1000次
    $spinTimes = 1000;
    $orderNo = '';
    while ($spinTimes > 0) {
        /** @var Goods $goodInfo */
        $goodInfo = Goods::query()->where(['id' => $gid])->first();
        // 商品不存在
        if ($goodInfo === null) {
            throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_NOT_FOUND));
        }
        // 库存不足
        if ($goodInfo->stock < $number) {
            throw new BusinessException(...self::getErrorMap(ErrorCode::GOOD_STOCK_EMPTY, [$goodInfo->name]));
        }

        $effectRows = Goods::query()
            ->where(['id' => $gid, 'version' => $goodInfo->version]) // 如果该版本已经被修改,那么更新条件无法命中
            ->update([
                'stock' => $goodInfo->stock - $number,
                'version' => $goodInfo->version + 1, // 新版本
            ]);
        if ($effectRows > 0) {
            $price = Goods::query()->where(['id' => $gid])->value('price');
            // 创建订单
            $orderNo = Math::getUniqueId();
            (new Orders([
                'uid' => $uid,
                'gid' => $gid,
                'order_no' => $orderNo,
                'number' => $number,
                'payment_money' => Math::mul($price, $number),
            ]))->save();
            break;
        }
        // 没有抢到继续自旋尝试.
        --$spinTimes;
    }

    if ($orderNo === '') {
        throw new BusinessException(...self::getErrorMap(ErrorCode::STOCK_EMPTY));
    }

    return $orderNo;
}
```
:::

---

::: warning 【注意】
自旋会有一定的性能损耗，请合理设置自旋逃离条件。\
其实 `自旋乐观锁` 、`版本控制乐观锁` 和 `redis阻塞模式锁`、`redis非阻塞模式锁` 有异曲同工之妙。:)
:::

## 使用场景

- 读多写少的场景