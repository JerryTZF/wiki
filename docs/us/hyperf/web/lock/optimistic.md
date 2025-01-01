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

prev: /us/hyperf/web/lock/pessimism
next: /us/hyperf/web/lock/queue
sidebarDepth: 3
---

# Optimistic Locking

目录

[[toc]]

::: tip 【Concept】
An optimistic lock, known as "Compare and Swap," serves as a contrast to pessimistic locking strategies. Pessimistic locks assume data immutability, lacking exclusivity. Only during data updates, verification against alterations by other processes is conducted. If changes are detected, modifications are eschewed; otherwise, alterations proceed.
> Optimistic locking is merely a design pattern and is not intrinsically linked to databases. In contrast, constructs such as `FOR UPDATE` and `LOCK` IN SHARE MODE fall squarely within the domain of pessimistic locking.

:::

---

## Conditional optimistic locking.

> When updating data, it is prudent to assess whether the updating criteria have changed. If they remain unchanged, it is then permissible to proceed with the data update.

---

::: tabs
@tab Example of a Controller
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
@tab Example of Logic
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

::: warning 【ABA】
- When comparing values during an update to determine whether a change has occurred, the sequence `old -> new -> old` may arise, which would evidently lead to complications.
- Exp：`UPDATE Goods SET stock={$new_stock} WHERE id={$id} AND stock={$old_stock}`。At this point, the old inventory data will exhibit fluctuations, returning to its previous values through a series of oscillations, leading to data inconsistency during updates.
:::

## Optimistic Locking in Version Control

> When the condition for assessment relies on field values in business operations, the aforementioned `ABA` concern may arise. Introducing an additional version control field solely dedicated to version assessment could insulate it from potential interference by business data.

---

:::tabs
@tab Example of a Controller
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
@tab Example of Logic
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

::: warning 【The issue of low hit rates】
While optimistic locking in version control can handle data correctly, it may lead to:：\
During brief periods of concurrency, only a small fraction of requests are effectively processed, while others are discarded. This manifests at the business level as follows: customers perceive available inventory, rush to make purchases, only to find themselves empty-handed, all while the displayed stock on the page does not reach **0**.
:::

## Spin Optimistic Locking

> To address the issue of the "low hit rate" in version control optimistic locking, we can allow different threads to spin in an attempt to update the data (with a requisite exit condition for spinning). Upon reaching this exit condition, we can then confirm the update has failed.

---

:::tabs
@tab Example of a Controller
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
@tab Example of Logic
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

::: warning
The angular momentum will incur a certain level of performance degradation, thus it is imperative to judiciously define the spin escape criteria.\
In fact, the concepts of `spin optimistic locking`, `version control optimistic locking`, and both `Redis blocking mode locks` and `Redis non-blocking mode locks` share a remarkable similarity in their underlying principles. :)
:::

## Usage Scenarios

- Environments characterized by a predominance of reads over writes.