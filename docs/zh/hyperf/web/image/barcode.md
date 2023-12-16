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

prev: /zh/hyperf/web/image/qrcode.md
next: /zh/hyperf/web/image/captcha.md
sidebarDepth: 3
---

# 条形码

目录
[[toc]]

---

## 安装依赖包

> [标准库地址](https://packagist.org/packages/picqer/php-barcode-generator)

```shell:no-line-numbers
composer require picqer/php-barcode-generator
```

## 封装工具类

> 不同的 [barType](https://github.com/picqer/php-barcode-generator/blob/main/examples.md) 效果. 

::: details 查看代码
```php
<?php

declare(strict_types=1);
namespace App\Lib\Image;

use Picqer\Barcode\BarcodeGenerator;
use Picqer\Barcode\BarcodeGeneratorPNG;

class Barcode
{
    /**
     * 生成器.
     */
    private BarcodeGenerator|BarcodeGeneratorPNG $generator;

    /**
     * 条码类型.
     * @see https://github.com/picqer/php-barcode-generator#accepted-barcode-types
     * @var mixed|string
     */
    private string $barType;

    /**
     * 条码宽度(单根竖条宽度).
     * @var int|mixed
     */
    private int $width;

    /**
     * 条码高度.
     * @var int|mixed
     */
    private int $height;

    /**
     * 前景色.
     * @var int[]|mixed
     */
    private array $foregroundColor;

    /**
     * 保存到本地路径.
     * @var mixed|string
     */
    private string $path;

    public function __construct(array $config = [])
    {
        $this->generator = new BarcodeGeneratorPNG();
        $this->barType = isset($config['bar_type']) && $config['bar_type'] !== '' ? $config['bar_type'] : $this->generator::TYPE_CODE_128;
        $this->width = isset($config['width']) ? intval($config['width']) : 1;
        $this->height = isset($config['height']) ? intval($config['height']) : 50;
        $this->foregroundColor = isset($config['foreground_color']) ? array_map('intval', $config['foreground_color']) : [0, 0, 0];
        $this->path = $config['path'] ?? BASE_PATH . '/runtime/barcode/';

        if (! is_dir($this->path)) {
            mkdir(iconv('GBK', 'UTF-8', $this->path), 0755);
        }
    }

    /**
     * 获取条形码字符串.
     * @param string $content 字符串内容
     * @return string 文件流字符串
     */
    public function getStream(string $content = ''): string
    {
        return $this->generator->getBarcode($content, $this->barType, $this->width, $this->height, $this->foregroundColor);
    }

    /**
     * 保存条码到本地.
     * @param string $filename 文件名
     * @param string $content 文件流字符串
     */
    public function move(string $filename, string $content = ''): void
    {
        file_put_contents(
            $this->path . $filename,
            $this->generator->getBarcode($content, $this->barType, $this->width, $this->height, $this->foregroundColor)
        );
    }
}

```
:::

## 使用

```php:no-line-numbers
#[GetMapping(path: 'barcode/stream')]
public function barcode(): MessageInterface|ResponseInterface
{
    $barcodeString = (new Barcode())->getStream('测试内容');
    return $this->response->withHeader('Content-Type', 'image/png')
        ->withBody(new SwooleStream($barcodeString));
}

#[GetMapping(path: 'barcode/save')]
public function saveBarcode(): array
{
    (new Barcode())->move('barcode.png', '测试内容');
    return $this->result->getResult();
}
```

---

::: warning 【注意】
PNG、JPG 类型需要 `Gd`、`Imagick` 库支持
:::