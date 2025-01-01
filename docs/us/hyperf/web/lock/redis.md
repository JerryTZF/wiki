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

prev: /us/hyperf/web/image/captcha
next: /us/hyperf/web/lock/pessimism
sidebarDepth: 3
---

# Redis Lock

Index

[[toc]]

## Necessary Conditions for Distributed Locks

- **Mutual exclusion**: At any given time, only one client can hold the lock.
- **No deadlock**: Even if a client crashes while holding the lock without explicitly releasing it, the system ensures that subsequent clients can acquire the lock.
- **Uniqueness**: The client that acquires the lock must be the one to release it. A client cannot release a lock set by another client, meaning no accidental unlocking.
- **Fault tolerance**: As long as the majority of Redis nodes are functioning properly, clients can acquire and release the lock.

## Install Dependencies

> [Standard Library Address](https://packagist.org/packages/lysice/hyperf-redis-lock)

```shell:no-line-numbers
composer require lysice/hyperf-redis-lock
```

::: warning
Redis Version > <Badge type="tip" text="2.8" vertical="middle" />
:::

## Encapsulate Utility Class

::: details Detail
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

## Exception Handling

> When using a blocking lock, if attempting to acquire the lock fails (i.e., the lock is not acquired within `$blockSeconds`), a `LockTimeoutException` will be thrown. We should make **`Hyperf`** catch this exception.
---

### *Encapsulate Exception Handler*

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

### *Register Exception Handler*

---

> Config File：`config/autoload/exceptions.php`

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

## Usage

### Blocking Mode and Non-blocking Mode Code Example

::: tabs
@tab Blocking Mode
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
@tab Non-blocking Mode
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
@tab Code for placing an order without locking
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

### Differences Between Blocking Mode and Non-blocking Mode

::: warning
Similarities：\
1、Both attempt to acquire the lock, and if the lock cannot be obtained, no update is performed. \
2、Both rely on `Redis` + `Lua` to implement serialization and event-by-event callbacks. \
3、Both may experience a scenario where 50 concurrent users attempt to grab 50 items from inventory, and there may still be remaining stock. However, non-blocking mode makes it easier to acquire the lock.\
Differences: \
1、In non-blocking mode, if the lock cannot be obtained, it immediately gives up the update. In blocking mode, the process will spin and attempt to acquire the lock again, until it times out and gives up the lock and update. \
2、If the timeout in blocking mode is set improperly, noticeable waiting may occur. In non-blocking mode, long waiting times are unlikely to happen.
:::

---

## Use Cases

- In a cluster mode, `write` operations across multiple nodes.。
- In multithreaded (or coroutine) programming, different threads modify shared data in memory.

## Other Cases

- Zookeeper