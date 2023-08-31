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

prev: /zh/hyperf/hyperf_web.md
next: /zh/hyperf/web/image/barcode.md
sidebarDepth: 3
---

# 二维码

目录
[[toc]]

---

## 安装依赖包

> [标准库地址](https://packagist.org/packages/endroid/qr-code)

```shell:no-line-numbers
composer require endroid/qr-code
```

## 封装工具类

::: details 查看代码
```php
<?php

declare(strict_types=1);

namespace App\Lib\Image;

use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevelLow;
use Endroid\QrCode\Label\Label;
use Endroid\QrCode\Logo\Logo;
use Endroid\QrCode\RoundBlockSizeMode\RoundBlockSizeModeMargin;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\Result\ResultInterface;
use Exception;

class Qrcode
{
    /**
     * 文字编码
     */
    private string $encoding = 'UTF-8';

    /**
     * 二维码尺寸.
     * @var int|mixed
     */
    private int $size;

    /**
     * 边距.
     * @var int|mixed
     */
    private int $margin;

    /**
     * logo路径.
     * @var mixed|string
     */
    private string $logoPath;

    /**
     * label文字.
     * @var mixed|string
     */
    private string $labelText;

    /**
     * 二维码保存路径.
     * @var mixed|string
     */
    private string $path;

    /**
     * 前景色.
     * @var int[]|mixed
     */
    private array $foregroundColor;

    /**
     * 背景色.
     * @var int[]|mixed
     */
    private array $backgroundColor;

    public function __construct(array $config = [])
    {
        $this->size = $config['size'] ?? 300;
        $this->margin = $config['margin'] ?? 10;
        $this->logoPath = $config['logo_path'] ?? '';
        $this->labelText = $config['label_text'] ?? '';
        $this->path = $config['path'] ?? BASE_PATH . '/runtime/qrcode/';
        $this->foregroundColor = $config['foreground_color'] ?? [0, 0, 0];
        $this->backgroundColor = $config['background_color'] ?? [255, 255, 255];

        if (! is_dir($this->path)) {
            mkdir(iconv('GBK', 'UTF-8', $this->path), 0755);
        }
    }

    /**
     * 获取二维码字符串.
     */
    public function getStream(string $content): string
    {
        return $this->getResult($content)->getString();
    }

    /**
     * 保存二维码到本地.
     */
    public function move(string $filename, string $content): void
    {
        $this->getResult($content)->saveToFile($this->path . $filename);
    }

    /**
     * 制作二维码
     * @throws Exception
     */
    private function getResult(string $content): ResultInterface
    {
        $writer = new PngWriter();
        $qrCode = \Endroid\QrCode\QrCode::create($content)
            ->setEncoding(new Encoding($this->encoding))
            ->setErrorCorrectionLevel(new ErrorCorrectionLevelLow())
            ->setSize($this->size)
            ->setMargin($this->margin)
            ->setRoundBlockSizeMode(new RoundBlockSizeModeMargin())
            ->setForegroundColor(new Color(...$this->foregroundColor))
            ->setBackgroundColor(new Color(...$this->backgroundColor));

        $logo = ! empty($this->logoPath) ? Logo::create($this->logoPath)
            ->setResizeToWidth(50)
            ->setPunchoutBackground(true) : null;

        $label = ! empty($this->labelText) ? Label::create($this->labelText)
            ->setTextColor(new Color(255, 0, 0)) : null;

        return $writer->write($qrCode, $logo, $label);
    }
}
```
:::

## 使用

```php:no-line-numbers
#[GetMapping(path: 'qrcode/stream')]
public function qrcode(): MessageInterface|ResponseInterface
{
    $qrCodeString = (new Qrcode())->getStream('测试内容');
    return $this->response->withHeader('Content-Type', 'image/png')
        ->withBody(new SwooleStream($qrCodeString));
}

#[GetMapping(path: 'qrcode/save')]
public function saveQrcode(): array
{
    (new Qrcode())->move('qrcode.png', '测试内容');
    return $this->result->getResult();
}
```

---

::: warning 【注意】
PNG、JPG 类型需要 `Gd`、`Imagick` 库支持
:::