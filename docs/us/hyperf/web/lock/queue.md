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

prev: /us/hyperf/web/lock/optimistic
next: /us/hyperf/web/office/excel
sidebarDepth: 3
---

# Queue (Single Consumer)

Index

[[toc]]

::: tip 【Principle】
Ensuring atomic execution of code block by setting the parallel consumption value to `1` and the number of processes to `1` in the `Redis asynchronous queue`.
:::

---

## Install dependencies.

> [Standard Library Address](https://packagist.org/packages/hyperf/redis)

```shell:no-line-numbers
composer require hyperf/redis
```

---

## Configure the queue settings

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

## Enrolling in the consumer process

::: danger
In this context, the consumption process must be set to 1. If it exceeds 1, concurrent consumption may occur across multiple processes, even though the granularity of consumption within each individual process remains at 1.
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

## Encapsulate the retrieval of the queue instance

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

## Define the message body

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

## Usage

::: warning
If a queue is being used, the operation is already executed asynchronously. Therefore, it is necessary to notify the customer elsewhere regarding the completion of the order placement process.
:::

---

::: tabs
@tab Example of a Controller
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
@tab Example of Logic
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