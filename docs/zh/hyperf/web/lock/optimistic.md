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

prev: /zh/hyperf/web/lock/pessimism
next: /zh/hyperf/web/lock/queue
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

## ABA 问题

> 当更新时比较数值是否变更的时候，可能会出现 `old -> new -> old` 然后进行更新，但是显然会有问题。\
> 举例：`UPDATE Goods SET stock={$new_stock} WHERE id={$id} AND stock={$old_stock}`。此时，老库存数据其实会出现加加减减
> 又恢复到之前的数值，此时更新就数据错乱了。

---

**引入version解决ABA**

::: details 查看代码
```php:no-line-numbers
#[GetMapping(path: 'cas/mysql')]
public function casWithDatabase(): array
{
    $gid = $this->request->input('gid', 1);
    $num = $this->request->input('num', 1);
    /** @var Goods $goodInfo */
    $goodInfo = Goods::where(['id' => $gid])->firstOrFail();
    if ($goodInfo->stock <= 0 || $goodInfo->stock < $num) {
        return $this->result->setErrorInfo(
            ErrorCode::STOCK_ERR,
            ErrorCode::getMessage(ErrorCode::STOCK_ERR, [$goodInfo->name])
        )->getResult();
    }

    $where = ['id' => $gid, 'version' => $goodInfo->version]; // old version
    $update = ['stock' => $goodInfo->stock - 1, 'version' => $goodInfo->version + 1]; // new version
    $effectRows = Goods::where($where)->update($update);
    if ($effectRows == 0) {
        return $this->result->setErrorInfo(
            ErrorCode::STOCK_BUSY,
            ErrorCode::getMessage(ErrorCode::STOCK_BUSY)
        )->getResult();
    }

    (new Orders([
        'gid' => $goodInfo->id,
        'order_id' => Str::random() . uniqid(),
        'number' => $num,
        'money' => $goodInfo->price * $num,
        'customer' => 'Jerry',
    ]))->save();
    return $this->result->getResult();
}
```
:::

## 空转问题

> 当更新条件不匹配后，会停止后续操作，出现大量请求没有产生实际的作用，那么可以通过 `自旋` 操作来加强成功率。

**加入自旋操作**

::: warning
自旋会增加性能损耗
:::

::: details 查看代码
```php:no-line-numbers
#[GetMapping(path: 'cas/rotation')]
public function casWithRotation(): array
{
    $gid = $this->request->input('gid', 1);
    $num = $this->request->input('num', 1);
    $rotationTimes = 1000;
    while ($rotationTimes > 0) {
        /** @var Goods $goodInfo */
        $goodInfo = Goods::where(['id' => $gid])->firstOrFail();
        // 库存不足
        if ($goodInfo->stock <= 0 || $goodInfo->stock < $num) {
            return $this->result->setErrorInfo(
                ErrorCode::STOCK_ERR,
                ErrorCode::getMessage(ErrorCode::STOCK_ERR, [$goodInfo->name])
            )->getResult();
        }
        $where = ['id' => $gid, 'version' => $goodInfo->version]; // old version
        $update = ['stock' => $goodInfo->stock - 1, 'version' => $goodInfo->version + 1]; // new version
        $effectRows = Goods::where($where)->update($update);
        if ($effectRows == 0) {
            --$rotationTimes;
            continue;
        }

        (new Orders([
            'gid' => $goodInfo->id,
            'order_id' => Str::random() . uniqid(),
            'number' => $num,
            'money' => $goodInfo->price * $num,
            'customer' => 'Jerry',
        ]))->save();
        break;
    }

    if ($rotationTimes <= 0) {
        return $this->result->setErrorInfo(
            ErrorCode::STOCK_BUSY,
            ErrorCode::getMessage(ErrorCode::STOCK_BUSY)
        )->getResult();
    }

    return $this->result->getResult();
}
```
:::

---

## 使用场景

- 读多写少的场景