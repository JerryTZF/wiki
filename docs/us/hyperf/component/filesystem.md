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

prev: /us/hyperf/component/process
next: /us/hyperf/component/cache
sidebarDepth: 3

---

# File System

Index
[[TOC]]

::: tip
The purpose of this component is to adapt to file storage systems from various cloud providers or different drivers,
such as `Alibaba Cloud OSS`, `Tencent Cloud COS`, `Amazon S3`, etc. \

The following example uses Alibaba Cloud as an illustration.
:::

## Install Dependencies

> [Standard Library Address](https://packagist.org/packages/hyperf/filesystem) \
> [Alibaba Cloud adapter URL](https://packagist.org/packages/hyperf/flysystem-oss)

***Dependencies***
```shell:no-line-numbers
composer require hyperf/filesystem
```

***Alibaba Cloud Adapter `Flysystem v3.0`***
```shell:no-line-numbers
composer require hyperf/flysystem-oss
```

---

## Component Exception Handling

***Exception Handler***

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\Filesystem\Exception\InvalidArgumentException;
use Hyperf\HttpMessage\Stream\SwooleStream;
use League\Flysystem\FilesystemException;
use OSS\Core\OssException;
use Psr\Http\Message\ResponseInterface;
use Throwable;

/**
 * 底层文件系统(三方包)异常处理器.
 * Class FileSystemExceptionHandler.
 */
class FileSystemExceptionHandler extends ExceptionHandler
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
                'code' => SystemCode::FILE_SYSTEM_ERR,
                'msg' => SystemCode::getMessage(SystemCode::FILE_SYSTEM_ERR, [$throwable->getMessage()]),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    /**
     * 是否满足处理条件(不同的适配器都有自己的对应的异常类, 请根据你的需求判断).
     * @param Throwable $throwable 异常
     * @return bool true|false
     */
    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof InvalidArgumentException
        || $throwable instanceof FilesystemException || $throwable instanceof OssException;
    }
}

```

***Register Exception***

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handler' => [
        'http' => [
            ...
            // 文件系统异常捕获
            App\Exception\Handler\FileSystemExceptionHandler::class,
            ...
        ],
    ],
];

```

## Encapsulating FileSystem

::: details Detail
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

## Usage

```php:no-line-numbers
#[GetMapping(path: 'file')]
public function file(): ResponseInterface
{
    return (new FileSystem())->download('/img/20210430171345.png');
}
```

## Config Exp

::: details
```php:no-line-numbers
<?php

declare(strict_types=1);
use function Hyperf\Support\env;

return [
    'default' => 'local',
    'storage' => [
        'local' => [
            'driver' => \Hyperf\Filesystem\Adapter\LocalAdapterFactory::class,
            'root' => __DIR__ . '/../../runtime',
        ],
        'ftp' => [
            'driver' => \Hyperf\Filesystem\Adapter\FtpAdapterFactory::class,
            'host' => 'ftp.example.com',
            'username' => 'username',
            'password' => 'password',
            // 'port' => 21,
            // 'root' => '/path/to/root',
            // 'passive' => true,
            // 'ssl' => true,
            // 'timeout' => 30,
            // 'ignorePassiveAddress' => false,
            // 'timestampsOnUnixListingsEnabled' => true,
        ],
        'memory' => [
            'driver' => \Hyperf\Filesystem\Adapter\MemoryAdapterFactory::class,
        ],
        's3' => [
            'driver' => \Hyperf\Filesystem\Adapter\S3AdapterFactory::class,
            'credentials' => [
                'key' => env('S3_KEY'),
                'secret' => env('S3_SECRET'),
            ],
            'region' => env('S3_REGION'),
            'version' => 'latest',
            'bucket_endpoint' => false,
            'use_path_style_endpoint' => false,
            'endpoint' => env('S3_ENDPOINT'),
            'bucket_name' => env('S3_BUCKET'),
        ],
        'minio' => [
            'driver' => \Hyperf\Filesystem\Adapter\S3AdapterFactory::class,
            'credentials' => [
                'key' => env('S3_KEY'),
                'secret' => env('S3_SECRET'),
            ],
            'region' => env('S3_REGION'),
            'version' => 'latest',
            'bucket_endpoint' => false,
            'use_path_style_endpoint' => true,
            'endpoint' => env('S3_ENDPOINT'),
            'bucket_name' => env('S3_BUCKET'),
        ],
        'oss' => [
            'driver' => \Hyperf\Filesystem\Adapter\AliyunOssAdapterFactory::class,
            'accessId' => env('OSS_ACCESS_ID'),
            'accessSecret' => env('OSS_ACCESS_SECRET'),
            'bucket' => env('OSS_BUCKET'),
            'endpoint' => env('OSS_ENDPOINT'),
            // 'timeout' => 3600,
            // 'connectTimeout' => 10,
            // 'isCName' => false,
            // 'token' => null,
            // 'proxy' => null,
        ],
        'qiniu' => [
            'driver' => \Hyperf\Filesystem\Adapter\QiniuAdapterFactory::class,
            'accessKey' => env('QINIU_ACCESS_KEY'),
            'secretKey' => env('QINIU_SECRET_KEY'),
            'bucket' => env('QINIU_BUCKET'),
            'domain' => env('QINIU_DOMAIN'),
        ],
        'cos' => [
            'driver' => \Hyperf\Filesystem\Adapter\CosAdapterFactory::class,
            'region' => env('COS_REGION'),
            'app_id' => env('COS_APPID'),
            'secret_id' => env('COS_SECRET_ID'),
            'secret_key' => env('COS_SECRET_KEY'),
            // 可选，如果 bucket 为私有访问请打开此项
            // 'signed_url' => false,
            'bucket' => env('COS_BUCKET'),
            'read_from_cdn' => false,
            // 'timeout' => 60,
            // 'connect_timeout' => 60,
            // 'cdn' => '',
            // 'scheme' => 'https',
        ],
    ],
];

```
:::