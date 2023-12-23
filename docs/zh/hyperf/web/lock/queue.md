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

prev: /zh/hyperf/web/lock/optimistic
next: /zh/hyperf/web/office/excel
sidebarDepth: 3
---

# 队列(单个消费)

目录

[[toc]]

::: tip 【原理】
通过 `Redis 异步队列` 的并行消费值设置为 `1`，进程数为 `1`， 来保证原子性执行代码块。
:::

---

## 安装依赖包

> [标准库地址](https://packagist.org/packages/hyperf/redis)

```shell:no-line-numbers
composer require hyperf/redis
```

---

## 设置队列配置

```php:no-line-numbers
<?php
return [
    ...
    // 并行消费为1的特殊队列
    ConstCode::LOCK_QUEUE_NAME => [
        // 使用驱动(这里我们使用Redis作为驱动。AMQP等其他自行更换)
        'driver' => Hyperf\AsyncQueue\Driver\RedisDriver::class,
        // Redis连接信息
        'redis' => [
            'pool' => 'default',
        ],
        // 队列前缀
        'channel' => 'lock-queue',
        // pop 消息的超时时间(详见：brPop)
        'timeout' => 2,
        // 消息重试间隔(秒)
        // [注意]: 真正的重试时间为: retry_seconds + timeout = 7；实验所得
        'retry_seconds' => 5,
        // 消费消息超时时间
        'handle_timeout' => 10,
        // 消费者进程数
        'processes' => 1,
        // 并行消费消息数目
        'concurrent' => [
            'limit' => 1,
        ],
    ],
    ...
];
```

## 注册消费进程

::: danger 【注意】
这里消费进程必须为1，当大于1时，尽管单个进程中的消费颗粒度为1，多个进程间会同时消费。
:::

```php:no-line-numbers
<?php

declare(strict_types=1);

namespace App\Process;

use App\Constants\ConstCode;
use Hyperf\AsyncQueue\Process\ConsumerProcess;
use Hyperf\Process\Annotation\Process;

#[Process(
    nums: 1, // 消费者进程数
    name: 'LockQueueConsumerProcess', // 队列名称
    redirectStdinStdout: false, // 重定向自定义进程的标准输入和输出
    enableCoroutine: true, // 是否启用协程
)]
class LockQueueConsumerProcess extends ConsumerProcess
{
    protected string $queue = ConstCode::LOCK_QUEUE_NAME;
}


```

## 封装获取队列实例

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\RedisQueue;

use App\Job\AbstractJob;
use App\Lib\Redis\Redis;
use Hyperf\AsyncQueue\Driver\DriverFactory;
use Hyperf\AsyncQueue\Driver\DriverInterface;
use Hyperf\Context\ApplicationContext;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

class RedisQueueFactory
{
    /**
     * 根据队列名称判断是否投递消息.
     */
    private const IS_PUSH_KEY = 'IS_PUSH_%s';

    /**
     * 获取队列实例.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function getQueueInstance(string $queueName = 'default'): DriverInterface
    {
        return ApplicationContext::getContainer()->get(DriverFactory::class)->get($queueName);
    }

    /**
     * 根据外部变量控制是否投递消息.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function safePush(AbstractJob $job, string $queueName = 'default', int $delay = 0): bool
    {
        // 动态读取外部变量, 判断是否投递
        $key = sprintf(static::IS_PUSH_KEY, $queueName);
        $isPush = Redis::getRedisInstance()->get($key);
        if ($isPush) {
            return self::getQueueInstance($queueName)->push($job, $delay);
        }
        return false;
    }
}

```

## 定义消息体

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Job;

use App\Lib\Log\Log;
use App\Lib\Math\Math;
use App\Model\Goods;
use App\Model\Orders;

class CreateOrderJob extends AbstractJob
{
    /**
     * 并行消费数为1的队列创建订单.
     */
    public function handle()
    {
        [$gid, $num, $uid, $orderNo] = [
            $this->params['gid'],
            $this->params['num'],
            $this->params['uid'],
            $this->params['order_no'],
        ];
        /** @var Goods $goodInfo */
        $goodInfo = Goods::query()->where(['id' => $gid])->first();
        // 商品不存在
        if ($goodInfo === null) {
            Log::warning('商品不存在', $this->params);
            return null;
        }
        // 库存不足
        if ($goodInfo->stock < $num) {
            Log::warning('库存不足', $this->params);
            return null;
        }

        // 创建订单
        (new Orders([
            'uid' => $uid,
            'gid' => $gid,
            'order_no' => $orderNo,
            'number' => $num,
            'payment_money' => Math::mul($goodInfo->price, $num),
        ]))->save();

        // 扣减库存
        $goodInfo->stock = $goodInfo->stock - $num;
        $goodInfo->save();
    }
}

```

## 使用

::: warning 【注意】
使用队列的话，已经是异步执行了，那么业务上需要在其他地方通知客户是否完成下单操作。
:::

---

:::: code-group
::: code-group-item 控制器示例
```php:no-line-numbers
/**
 * 使用并行消费数为1的队列创建订单.
 * @param LockRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'queue/consume')]
#[Scene(scene: 'create_order')]
public function createOrderByLockQueue(LockRequest $request): array
{
    $gid = intval($request->input('gid'));
    $num = intval($request->input('number'));
    $uid = $this->jwtPayload['data']['uid'];
    $orderNo = $this->service->createOrderWithLockQueue($uid, $gid, $num);

    return $this->result->setData(['oder_no' => $orderNo])->getResult();
}
```
:::
::: code-group-item 逻辑示例
```php:no-line-numbers
/**
 * 使用并行消费数为1的队列创建订单(虽然会返回订单号,但是不一定购买成功).
 * @param int $uid 用户id
 * @param int $gid 商品id
 * @param int $number 购买数量
 * @return string 订单编号
 */
public function createOrderWithLockQueue(int $uid, int $gid, int $number = 1): string
{
    $orderNo = Math::getUniqueId();
    Coroutine::create(function () use ($uid, $gid, $number, $orderNo) {
        // 队列消费配置请看:
        // config/autoload/async_queue.php 中 ConstCode::LOCK_QUEUE_NAME 队列的 concurrent.limit配置.
        $job = new CreateOrderJob(uniqid(), [
            'uid' => $uid,
            'gid' => $gid,
            'num' => $number,
            'order_no' => $orderNo,
        ]);
        RedisQueueFactory::safePush($job, ConstCode::LOCK_QUEUE_NAME, 0);
    });

    return $orderNo;
}
```
:::
::::