---
sidebar: [
{text: '📞 事件机制', collapsible: true, children: [
{text: '事件角色和注意事项', link: 'hyperf/component/event/event'},
{text: '代码示例', link: 'hyperf/component/event/code'},
]},
{text: '⏰ 定时任务', link: 'hyperf/component/crontab'},
{text: '⛓ 自定义进程', link: 'hyperf/component/process'},
{text: '📝 文件系统', link: 'hyperf/component/filesystem'},
{text: '🕓 缓存系统', link: 'hyperf/component/cache'},
{text: '📩 异步队列', collapsible: true, children: [
{text: '队列使用', link: 'hyperf/component/queue/overview'},
{text: '注意事项', link: 'hyperf/component/queue/info'},
]},
{text: '🚦 信号处理器', link: 'hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: 'hyperf/component/guzzle'},
{text: '📉 限流器', link: 'hyperf/component/limit'},
{text: '❌ 异常处理器', link: 'hyperf/component/exception'},
{text: '🖨 日志', link: 'hyperf/component/log'},
{text: '📡 命令行', link: 'hyperf/component/command'},
{text: '🔁 WebSocket', link: 'hyperf/component/websocket'},
]

prev: /hyperf/component/filesystem
next: /hyperf/component/queue/overview
sidebarDepth: 3

---

# 缓存系统

目录
[[TOC]]

::: tip 【说明】
- 该组件基于[AOP](https://hyperf.wiki/3.0/#/zh-cn/aop)，可以理解为Python的`装饰器`。执行方法前后先执行其他代码。
- 使用有两种方式，一种是简单使用，获取实例存储、读取、删除等；另一种是通过注解，切入要缓存的方法，读取时直接走缓存。
:::

## 安装依赖

```shell:no-line-numbers
composer require hyperf/cache
```

## 封装工具类

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

## 简单使用


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

## 注解使用

::: warning 【注意】
- 这里只是示例 `Cacheable` 注解；`CachePut` 、 `CacheEvict` 不常用也比较简单，就不列举。
- 注解中的 `value` 参数不是缓存的值，而是缓存的key！这里一定要注意
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