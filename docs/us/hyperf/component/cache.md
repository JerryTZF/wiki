---
sidebar: [
{text: '📞 Event Mechanism', collapsible: true, children: [
{text: 'Event Roles and Considerations', link: 'hyperf/component/event/event'},
{text: 'Code Example', link: 'hyperf/component/event/code'},
]},
{text: '⏰ Crontab', link: 'hyperf/component/crontab'},
{text: '⛓ Processes', link: 'hyperf/component/process'},
{text: '📝 File System', link: 'hyperf/component/filesystem'},
{text: '🕓 Cache', link: 'hyperf/component/cache'},
{text: '📩 Queue', collapsible: true, children: [
{text: 'Queue Usage', link: 'hyperf/component/queue/overview'},
{text: 'Notes', link: 'hyperf/component/queue/info'},
]},
{text: '🚦 Signal', link: 'hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: 'hyperf/component/guzzle'},
{text: '📉 Rate Limiter', link: 'hyperf/component/limit'},
{text: '❌ Exception', link: 'hyperf/component/exception'},
{text: '🖨 Logs', link: 'hyperf/component/log'},
{text: '📡 Command', link: 'hyperf/component/command'},
{text: '🔁 WebSocket', link: 'hyperf/component/websocket'},
]

prev: /us/hyperf/component/filesystem
next: /us/hyperf/component/queue/overview
sidebarDepth: 3

---

# Cache

Index
[[TOC]]

::: tip 【Note】
- This component is based on [AOP(Aspect-Oriented Programming)](https://hyperf.wiki/3.0/#/zh-cn/aop).
  It can be understood as the `decorators` in Python, where additional code is executed before or after the method is executed.
- There are two ways to use it: one is simple usage, where you get the instance to store, read, delete, etc.; the other is through annotations, which intercept the methods to be cached, and reading directly accesses the cache.
:::

## Install Dependencies

```shell:no-line-numbers
composer require hyperf/cache
```

## Encapsulation of Utility Class

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Cache;

use DateInterval;
use Hyperf\Cache\Listener\DeleteListenerEvent;
use Hyperf\Context\ApplicationContext;
use Hyperf\Di\Annotation\Inject;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\SimpleCache\CacheInterface;

/**
 * @method static mixed get(string $key, mixed $default = null)
 * @method static bool set(string $key, mixed $value, null|int|DateInterval $ttl = null)
 * @method static bool delete(string $key)
 * @method static bool clear()
 * @method static iterable getMultiple(iterable $keys, mixed $default = null)
 * @method static bool setMultiple(iterable $values, null|int|DateInterval $ttl = null)
 * @method static bool deleteMultiple(iterable $keys)
 * @method static bool has(string $key)
 */
class Cache
{
    /**
     * 事件触发器.
     * @var eventDispatcherInterface 触发器实体类
     */
    #[Inject]
    protected EventDispatcherInterface $dispatcher;

    /**
     * 静态调用.
     * @param mixed $action 方法
     * @param mixed $args 参数
     * @return mixed 返回
     * @throws ContainerExceptionInterface 异常实体类
     * @throws NotFoundExceptionInterface 异常实体类
     */
    public static function __callStatic(mixed $action, mixed $args)
    {
        return self::getInstance()->{$action}(...$args);
    }

    /**
     * 获取实例.
     * @return CacheInterface 缓存实体类
     * @throws ContainerExceptionInterface 异常
     * @throws NotFoundExceptionInterface 异常
     */
    public static function getInstance(): CacheInterface
    {
        return ApplicationContext::getContainer()->get(CacheInterface::class);
    }

    /**
     * 清除缓存.
     * @param string $listener 监听器
     * @param array $args 参数
     */
    public function flush(string $listener, array $args)
    {
        $this->dispatcher->dispatch(new DeleteListenerEvent($listener, $args));
    }
}

```

## Usage

```php:no-line-numbers
#[GetMapping(path: 'simple/cache')]
public function simpleCache(): array
{
    try {
        $cache = Cache::getInstance();
        // 一般对于缓存,Key里面会加入一些变量,那么可以将Key写入枚举类
        $key = sprintf('%s:%s', 'YOUR_APPID', 'USER_ID');
        // 一次写入单个缓存
        $cache->set($key, ['a' => 'b'], 300);
        // 读取单个缓存
        $cacheData = $cache->get($key, '');
        // 一次写入多个缓存(具有原子性)
        $cache->setMultiple(['key1' => 'value1', 'key2' => 'value2'], 300);
        // 一次读取多个缓存
        $multipleData = $cache->getMultiple(['key1', 'key2'], []);

        // 清除所有的key
        $cache->clear();
    } catch (Throwable $e) {
        return $this->result->setErrorInfo($e->getCode(), $e->getMessage())->getResult();
    }

    return $this->result->setData([
        'single' => $cacheData,
        'multiple' => $multipleData,
    ])->getResult();
}
```

## Annotation Usage

::: warning 【Note】
- This is just an example of the `Cacheable` annotation; `CachePut` and `CacheEvict` are less commonly used and quite simple, so they are not listed here.
- The `value` parameter in the annotation is not the value of the cache, but the cache key! Please note this carefully.
  :::

---

```php:no-line-numbers
#[GetMapping(path: 'inject/cache')]
#[Cacheable(prefix: 'test_api', value: '#{param1}_#{param2}', ttl: 600, listener: 'UPDATE_TEST')]
public function getFromCache(string $param1 = 'hello', string $param2 = 'world'): array
{
    Log::stdout()->info("I'm Running...");
    return $this->result->setData(['param1' => $param1, 'param2' => $param2])->getResult();
}

#[GetMapping(path: 'flush/cache')]
public function flushCache(): array
{
    // 在指定时机刷新监听 'UPDATE_TEST' 事件的缓存.
    (new Cache())->flush('UPDATE_TEST', [
        'param1' => 'hello',
        'param2' => 'world',
    ]);

    return $this->result->getResult();
}
```