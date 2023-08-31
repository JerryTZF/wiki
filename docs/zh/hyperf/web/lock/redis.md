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

::: warning 【注意】
Redis Version 大于 <Badge type="tip" text="2.8" vertical="middle" />
:::

## 封装工具类

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Lock;

use App\Lib\Redis\Redis;
use Lysice\HyperfRedisLock\LockTimeoutException;

class RedisLock
{
    /**
     * 锁名称.
     */
    private string $lockName;

    /**
     * 锁定的时间长度(该值一般应大于等于闭包执行的耗时).
     */
    private int $lockingSeconds;

    /**
     * 锁定的标志位.
     * @var null|mixed|string
     */
    private string $owner;

    /**
     * 等待获取锁的超时时间(一般小于等于$lockingSeconds).
     */
    private int $blockSeconds;

    /**
     * 锁实例.
     */
    private \Lysice\HyperfRedisLock\RedisLock $lock;

    public function __construct(string $lockName, int $lockingSeconds, int $blockSeconds = 3, $owner = null)
    {
        $this->blockSeconds = $blockSeconds;
        $this->lockName = $lockName;
        $this->lockingSeconds = $lockingSeconds;
        $this->owner = $owner;

        $redisInstance = Redis::getRedisInstance();
        // who(不同的客户端) 持有 what(不同业务场景) 样子的锁
        $this->lock = new \Lysice\HyperfRedisLock\RedisLock(
            $redisInstance, // Redis实例
            $this->lockName, // 锁名称
            $this->lockingSeconds, // 该锁生效的持续时间上限
            $this->owner ?? null // 谁持有该锁
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
     * @throws LockTimeoutException
     */
    public function lockAsync(callable $func): mixed
    {
        return $this->lock->block($this->blockSeconds, $func);
    }
}

```
:::

## 异常处理

> 当使用阻塞式锁时，尝试获取锁失败会抛出 `LockTimeoutException` 异常，我们应该使 **`Hyperf`** 捕获该异常。

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

class LockTimeoutExceptionHandler extends ExceptionHandler
{
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

```php:no-line-numbers
#[GetMapping(path: 'lock/sync')]
public function redisLockSync(): array
{
    // 不同的业务场景需要不同的实例(不可make获取该对象)
    $lock = new RedisLock('testLock', 5, 3, 'redisLockSync');
    // 非阻塞: 获取不到直接返回false, 不等待持有者释放锁
    $result = $lock->lockSync(function () {
        sleep(1); // 模拟业务耗时
        return ['a' => 'A'];
    });

    return $this->result->setData($result)->getResult();
}

#[GetMapping(path: 'lock/async')]
public function redisLockAsync(): array
{
    // 不同的业务场景需要不同的实例(不可make获取该对象)
    $lock = new RedisLock('testLock_', 5, 3, 'redisLockAsync');
    // 阻塞式: 获取不到会以每200ms的频率依次尝试再次获取, 直至3秒后超时, 抛出异常
    $result = $lock->lockAsync(function () {
        sleep(1); // 模拟业务耗时
        return ['a' => 'A'];
    });

    return $this->result->setData($result)->getResult();
}
```

---

## 使用场景

- 集群模式中，多节点的 `写` 操作。
- 多线程(或协程)编程中，不同的线程对内存的数据进行变更操作。

## 其他方案

- Zookeeper