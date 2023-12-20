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
]

prev: /zh/hyperf/web/image/captcha
next: /zh/hyperf/web/lock/pessimism
sidebarDepth: 3
---

# Redis分布式锁

目录

[[toc]]

## 分布式锁的必要条件

- 互斥性。在任意时刻，只有一个客户端能持有锁。
- 不会发生死锁。即使有一个客户端在持有锁的期间崩溃而没有主动解锁，也能保证后续其他客户端能加锁。
- 唯一性。解铃还须系铃人，加锁和解锁必须是同一个客户端，客户端自己不能把别人加的锁给解了，即不能误解锁。
- 具有容错性。只要大多数Redis节点正常运行，客户端就能够获取和释放锁。

## 安装依赖包

> [标准库地址](https://packagist.org/packages/lysice/hyperf-redis-lock)

```shell:no-line-numbers
composer require lysice/hyperf-redis-lock
```

::: warning 【注意】
Redis Version 大于 <Badge type="tip" text="2.8" vertical="middle" />
:::

## 封装工具类

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Lock;

use Hyperf\Context\ApplicationContext;
use Hyperf\Redis\Redis;
use Lysice\HyperfRedisLock\LockTimeoutException;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

class RedisLock
{
    /**
     * 锁名称.
     * @var string 锁名称
     */
    private string $lockName;

    /**
     * 锁定的时间长度(该值一般应大于等于闭包执行的耗时).
     * @var int 秒数
     */
    private int $lockingSeconds;

    /**
     * 锁定的标志位(持有者).
     * @var null|mixed|string
     */
    private string $owner;

    /**
     * 等待获取锁的超时时间(阻塞上限秒数; 一般小于等于$lockingSeconds).
     * @var int 阻塞秒数
     */
    private int $blockSeconds;

    /**
     * 锁实例.
     * @var \Lysice\HyperfRedisLock\RedisLock 实例
     */
    private \Lysice\HyperfRedisLock\RedisLock $lock;

    /**
     * 实例化.
     * @param string $lockName 锁名称
     * @param int $lockingSeconds 锁定秒数(超过该数值,锁会自动释放)
     * @param int $blockSeconds 阻塞秒数(超过该数值, 会抛出异常)
     * @param string $owner 锁的持有者
     * @throws ContainerExceptionInterface 异常
     * @throws NotFoundExceptionInterface 异常
     */
    public function __construct(string $lockName, int $lockingSeconds, int $blockSeconds = 3, string $owner = '')
    {
        $this->blockSeconds = $blockSeconds;
        $this->lockName = $lockName;
        $this->lockingSeconds = $lockingSeconds;
        $this->owner = $owner;

        $redisInstance = ApplicationContext::getContainer()->get(Redis::class);
        // who(不同的客户端) 持有 what(不同业务场景) 样子的锁
        $this->lock = new \Lysice\HyperfRedisLock\RedisLock(
            $redisInstance, // Redis实例
            $this->lockName, // 锁名称
            $this->lockingSeconds, // 该锁生效的持续时间上限
            $this->owner ?: null // 谁持有该锁
        );
    }

    /**
     * 非阻塞形式锁定.
     * @param callable $func 需锁定的闭包
     * @return mixed bool:false 获取锁失败; mixed: 闭包返回的结果
     */
    public function lockSync(callable $func): mixed
    {
        return $this->lock->get($func);
    }

    /**
     * 阻塞形式锁定.
     * @param callable $func 需锁定的闭包
     * @return mixed bool:false 获取锁失败; mixed: 闭包返回的结果
     * @throws LockTimeoutException 异常
     */
    public function lockAsync(callable $func): mixed
    {
        return $this->lock->block($this->blockSeconds, $func);
    }
}

```
:::

## 异常处理

> 当使用阻塞式锁时，尝试获取锁失败($blockSeconds秒内没有获取到锁)会抛出 `LockTimeoutException` 异常，我们应该使 **`Hyperf`** 捕获该异常。

---

### *封装异常处理器*

---

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Lysice\HyperfRedisLock\LockTimeoutException;
use Psr\Http\Message\ResponseInterface;
use Throwable;

/**
 * Redis锁异常处理器.
 * Class LockTimeoutExceptionHandler.
 */
class LockTimeoutExceptionHandler extends ExceptionHandler
{
    /**
     * 处理类.
     * @param Throwable $throwable 异常
     * @param ResponseInterface $response 响应接口实现类
     * @return ResponseInterface 响应接口实现类
     */
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        $this->stopPropagation();

        return $response->withHeader('Content-Type', 'application/json')
            ->withStatus(200)->withBody(new SwooleStream(json_encode([
                'code' => SystemCode::LOCK_WAIT_TIMEOUT,
                'msg' => SystemCode::getMessage(SystemCode::LOCK_WAIT_TIMEOUT),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    /**
     * 是否满足处理条件.
     * @param Throwable $throwable 异常
     * @return bool true|false
     */
    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof LockTimeoutException;
    }
}

```
---

### *注册异常处理器*

---

> 配置文件：`config/autoload/exceptions.php`

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handler' => [
        'http' => [
            ...
            // redis锁组件异常处理器
            App\Exception\Handler\LockTimeoutExceptionHandler::class,
            ...
        ],
    ],
];

```

## 使用

### 阻塞模式和非阻塞模式代码示例

:::: code-group
::: code-group-item 阻塞模式
```php:no-line-numbers
/**
 * 创建订单(阻塞形式锁).
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 * @throws LockTimeoutException 阻塞超时异常
 * @throws ContainerExceptionInterface 异常
 * @throws NotFoundExceptionInterface 异常
 */
#[PostMapping(path: 'redis/async')]
#[Scene(scene: 'create_order')]
public function createOrderByAsyncRedisLock(LockRequest $request): array
{
    $gid = $request->input('gid');
    $num = $request->input('number');
    $uid = $this->jwtPayload['data']['uid'];

    [$lockName, $lockingSeconds, $blockSeconds, $owner] = [
        'create_order_async_lock', // 锁名称
        3, // 闭包内方法应在3秒内完成, 超过3秒后自动释放该锁
        1, // 1秒内获取不到锁, 会抛出LockTimeoutException异常(每250ms尝试获取一次)
        sprintf('%s_%s_create_order_scene_async', $uid, $gid),
    ];
    $lock = new RedisLock($lockName, $lockingSeconds, $blockSeconds, $owner);
    $orderNo = $lock->lockAsync(function () use ($gid, $num, $uid) {
        return $this->service->createOrderWithoutLock($uid, intval($gid), intval($num));
    });

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
:::
::: code-group-item 非阻塞模式
```php:no-line-numbers
/**
 * 创建订单(非阻塞形式锁).
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 * @throws ContainerExceptionInterface 异常
 * @throws NotFoundExceptionInterface 异常
 * @throws LockTimeoutException 异常
 */
#[PostMapping(path: 'redis/sync')]
#[Scene(scene: 'create_order')]
public function createOrderBySyncRedisLock(LockRequest $request): array
{
    $gid = $request->input('gid');
    $num = $request->input('number');
    $uid = $this->jwtPayload['data']['uid'];

    [$lockName, $lockingSeconds, $blockSeconds, $owner] = [
        'create_order_async_lock', // 锁名称
        3, // 闭包内方法应在3秒内完成, 超过3秒后自动释放该锁
        1, // 非阻塞该字段无效. 获取不到锁不会阻塞着尝试继续获取, 会直接返回false.
        sprintf('%s_%s_create_order_scene_sync', $uid, $gid),
    ];
    $lock = new RedisLock($lockName, $lockingSeconds, $blockSeconds, $owner);
    $orderNo = $lock->lockSync(function () use ($gid, $num, $uid) {
        return $this->service->createOrderWithoutLock($uid, intval($gid), intval($num));
    });
    if ($orderNo === false) {
        throw new LockTimeoutException();
    }

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
:::
::: code-group-item 无锁下单代码
```php:no-line-numbers
/**
 * 不加锁的创建订单并扣减库存(外部请加锁!!!).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithoutLock(int $uid, int $gid, int $number = 1): string
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

    return $orderNo;
}
```
:::
::::

### 阻塞模式和非阻塞模式的迥异

::: warning 【注意】
相同点：\
1、都是尝试去获取锁，获取不到锁则不进行更新。\
2、都是依赖 `Redis` + `Lua` 实现串行化和事件逐一回调完成。\
3、都可能出现50的并发抢购50的库存，库存还有剩余的情况。无非阻塞模式更容易获取到锁。\
不同点: \
1、非阻塞模式尝试获取锁，如果获取不到，则立即放弃更新。而阻塞模式会自旋尝试再次获取，直到超时放弃获取锁，放弃更新。\
2、阻塞模式的超时时间如果设置不合理，会出现明显的等待。而非阻塞模式基本不会出现较长时间等待。
:::

---

## 使用场景

- 集群模式中，多节点的 `写` 操作。
- 多线程(或协程)编程中，不同的线程对内存的数据进行变更操作。

## 其他方案

- Zookeeper