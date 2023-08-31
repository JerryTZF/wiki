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
    'limit-queue' => [
        // 使用驱动(这里我们使用Redis作为驱动。AMQP等其他自行更换)
        'driver' => Hyperf\AsyncQueue\Driver\RedisDriver::class,
        // Redis连接信息
        'redis' => [
            'pool' => 'default',
        ],
        // 队列前缀
        'channel' => 'limit',
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
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
namespace App\Process;

use Hyperf\AsyncQueue\Process\ConsumerProcess;
use Hyperf\Process\Annotation\Process;

#[Process(
    nums: 1, // 消费者进程数
    name: 'LimitQueueConsumer', // 队列名称
    redirectStdinStdout: false, // 重定向自定义进程的标准输入和输出
    enableCoroutine: true, // 是否启用协程
)]
class LimitQueueConsumer extends ConsumerProcess
{
    protected string $queue = 'limit-queue';
}

```

## 封装获取队列实例

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\RedisQueue;

use Hyperf\AsyncQueue\Driver\DriverFactory;
use Hyperf\AsyncQueue\Driver\DriverInterface;
use Hyperf\Context\ApplicationContext;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

class RedisQueueFactory
{
    /**
     * 获取队列实例.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public static function getQueueInstance(string $queueName = 'default'): DriverInterface
    {
        return ApplicationContext::getContainer()->get(DriverFactory::class)->get($queueName);
    }
}
```

## 定义消息体

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Job;

use App\Lib\Log\Log;
use App\Model\Goods;
use App\Model\Orders;
use Hyperf\Stringable\Str;

class CreateOrderJob extends AbstractJob
{
    public function __construct(string $uniqueId, array $params)
    {
        parent::__construct($uniqueId, $params);
    }

    public function handle()
    {
        [$gid, $num] = [$this->params['gid'], $this->params['num']];
        /** @var Goods $goodInfo */
        $goodInfo = Goods::where(['id' => $gid])->firstOrFail();
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
        } else {
            Log::warning("{$goodInfo->name} 库存不足 !!!");
        }
    }
}

```

## 使用

```php:no-line-numbers
#[GetMapping(path: 'lock/queue')]
public function redisQueueLock(): array
{
    $queueParams = [
        'gid' => $this->request->input('gid', 1),
        'num' => $this->request->input('num', 1),
    ];
    $client = '121.1.21.331' . uniqid();
    $queueInstance = RedisQueueFactory::getQueueInstance('limit-queue');
    $isPushSuccess = $queueInstance->push(new CreateOrderJob($client, $queueParams));
    if (! $isPushSuccess) {
        return $this->result->setErrorInfo(
            ErrorCode::QUEUE_PUSH_ERR,
            ErrorCode::getMessage(ErrorCode::QUEUE_PUSH_ERR, [CreateOrderJob::class])
        )->getResult();
    }

    return $this->result->getResult();
}
```