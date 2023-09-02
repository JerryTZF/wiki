---
sidebar: [
{text: '📞 事件机制', collapsible: true, children: [
{text: '事件角色和注意事项', link: '/zh/hyperf/component/event/event'},
{text: '代码示例', link: '/zh/hyperf/component/event/code'},
]},
{text: '⏰ 定时任务', link: '/zh/hyperf/component/crontab'},
{text: '⛓ 自定义进程', link: '/zh/hyperf/component/process'},
{text: '📝 文件系统', link: '/zh/hyperf/component/filesystem'},
{text: '🕓 缓存系统', link: '/zh/hyperf/component/cache'},
{text: '📩 异步队列', link: '/zh/hyperf/component/queue'},
{text: '📻 信号处理器', link: '/zh/hyperf/component/signal'},
{text: '📤 http', link: '/zh/hyperf/component/guzzle'},
{text: '📉 限流器', link: '/zh/hyperf/component/limit'},
{text: '📮 异步Task', link: '/zh/hyperf/component/task'},
{text: '❌ 异常处理器', link: '/zh/hyperf/component/exception'},
]

prev: /zh/hyperf/component/process
next: /zh/hyperf/component/cache
sidebarDepth: 3

---

# 文件系统

目录
[[TOC]]

::: tip
该组件的作用是：适配各大云厂商或不同驱动的文件存储系统，例如 `阿里云OSS`、`腾讯云COS`、`亚马逊S3` 等。\
以下以阿里云为例。
:::

## 安装依赖

> [标准库地址](https://packagist.org/packages/hyperf/filesystem) \
> [阿里云适配器地址](https://packagist.org/packages/hyperf/flysystem-oss)

***底层依赖***
```shell:no-line-numbers
composer require hyperf/filesystem
```

***阿里云适配器 `Flysystem v3.0`***
```shell:no-line-numbers
composer require hyperf/flysystem-oss
```

---

## 封装文件系统

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\File;

use Hyperf\Context\ApplicationContext;
use Hyperf\Filesystem\FilesystemFactory;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\HttpServer\Response;
use JetBrains\PhpStorm\ArrayShape;
use League\Flysystem\FilesystemException;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\Http\Message\ResponseInterface;

// 底层API请参考: https://flysystem.thephpleague.com/docs/usage/filesystem-api/
// 异常已经在框架注册, 无需处理
class FileSystem
{
    /**
     * 文件系统实例.
     */
    private \League\Flysystem\Filesystem $fileInstance;

    /**
     * 适配器请根据对应的配置进行填写.
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function __construct(string $adapterName = 'oss')
    {
        $factory = ApplicationContext::getContainer()->get(FilesystemFactory::class);
        $this->fileInstance = $factory->get($adapterName);
    }

    /**
     * 读取文件, 输出文件内容.
     * @return resource|string
     * @throws FilesystemException
     */
    public function read(string $filename, bool $withStream = false)
    {
        return $withStream ? $this->fileInstance->readStream($filename) :
            $this->fileInstance->read($filename);
    }

    /**
     * 下载文件.
     * @throws FilesystemException
     */
    public function download(string $filename): ResponseInterface
    {
        $file = basename($filename);
        $response = new Response();
        return $response->withHeader('content-description', 'File Transfer')
            ->withHeader('content-type', $this->fileInstance->mimeType($filename))
            ->withHeader('content-disposition', "attachment; filename={$file}")
            ->withHeader('content-transfer-encoding', 'binary')
            ->withBody(new SwooleStream((string) $this->fileInstance->read($filename)));
    }

    /**
     * 写入文件.
     * @throws FilesystemException
     */
    public function write(string $filename, mixed $content, bool $withStream = false, bool $isCover = true): void
    {
        $isHas = $this->fileInstance->has($filename);
        if ($isCover || (! $isHas)) {
            $withStream ? $this->fileInstance->writeStream($filename, $content) :
                $this->fileInstance->write($filename, $content);
        }
    }

    /**
     * 删除文件.
     * @throws FilesystemException
     */
    public function delete(string $path): void
    {
        $this->fileInstance->delete($path);
    }

    /**
     * 获取目录下文件列表.
     * @param bool $recursive 是否递归查询
     * @throws FilesystemException
     */
    public function list(string $path, bool $recursive = false): array
    {
        return $this->fileInstance->listContents($path, $recursive)->toArray();
    }

    /**
     * 获取文件的元数据.
     * @throws FilesystemException
     */
    #[ArrayShape(['visibility' => 'mixed', 'size' => 'mixed', 'mime' => 'mixed', 'last_modified' => 'int'])]
    public function getFileMetaData(string $filename): array
    {
        return [
            'visibility' => $this->fileInstance->visibility($filename),
            'size' => $this->fileInstance->fileSize($filename),
            'mime' => $this->fileInstance->mimeType($filename),
            'last_modified' => $this->fileInstance->lastModified($filename),
        ];
    }

    /**
     * 获取文件系统实例.
     */
    public function getInstance(): \League\Flysystem\Filesystem
    {
        return $this->fileInstance;
    }
}

```
:::

## 使用

```php:no-line-numbers
#[GetMapping(path: 'file')]
public function file(): ResponseInterface
{
    return (new FileSystem())->download('/img/20210430171345.png');
}
```