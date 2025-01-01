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

prev: /us/hyperf/hyperf_web.md
next: /us/hyperf/web/image/barcode.md
sidebarDepth: 3
---

# Qrcode

Index
[[toc]]

---

## Install Dependencies.

> [Standard Library Address.](https://packagist.org/packages/endroid/qr-code)

```shell:no-line-numbers
composer require endroid/qr-code
```

## Encapsulation of utility classes.

::: details Detail
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
use Endroid\QrCode\Writer\EpsWriter;
use Endroid\QrCode\Writer\GifWriter;
use Endroid\QrCode\Writer\PdfWriter;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\Result\ResultInterface;
use Endroid\QrCode\Writer\SvgWriter;
use Exception;

class Qrcode
{
    /**
     * logo边长.
     */
    private int $logoSize;

    /**
     * 输出二维码的 Mime 类型.
     */
    private string $mime;

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
        $this->size = isset($config['size']) ? intval($config['size']) : 300;
        $this->margin = isset($config['margin']) ? intval($config['margin']) : 10;
        $this->logoPath = $config['logo_path'] ?? '';
        $this->labelText = $config['label_text'] ?? '';
        $this->path = $config['path'] ?? BASE_PATH . '/runtime/qrcode/';
        $this->mime = $config['mime'] ?? 'png';
        $this->logoSize = isset($config['logo_size']) ? intval($config['logo_size']) : 50;
        $this->foregroundColor = isset($config['foreground_color']) ? array_map('intval', $config['foreground_color']) : [0, 0, 0];
        $this->backgroundColor = isset($config['background_color']) ? array_map('intval', $config['background_color']) : [255, 255, 255];

        if (! is_dir($this->path)) {
            mkdir(iconv('GBK', 'UTF-8', $this->path), 0755);
        }
    }

    /**
     * 获取二维码字符串.
     * @throws Exception
     */
    public function getStream(string $content): string
    {
        return $this->getResult($content)->getString();
    }

    /**
     * 获取二维码MIME类型.
     * @throws Exception
     */
    public function getMimeType(string $content): string
    {
        return $this->getResult($content)->getMimeType();
    }

    /**
     * 保存二维码到本地.
     * @throws Exception
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
        $writer = match (true) {
            $this->mime == 'eps' => new EpsWriter(),
            $this->mime == 'pdf' => new PdfWriter(),
            $this->mime == 'svg' => new SvgWriter(),
            $this->mime == 'gif' => new GifWriter(),
            default => new PngWriter(),
        };
        $qrCode = \Endroid\QrCode\QrCode::create($content)
            ->setEncoding(new Encoding($this->encoding))
            ->setErrorCorrectionLevel(new ErrorCorrectionLevelLow())
            ->setSize($this->size)
            ->setMargin($this->margin)
            ->setRoundBlockSizeMode(new RoundBlockSizeModeMargin())
            ->setForegroundColor(new Color(...$this->foregroundColor))
            ->setBackgroundColor(new Color(...$this->backgroundColor));

        $logo = ! empty($this->logoPath) ? Logo::create($this->logoPath)
            ->setResizeToWidth($this->logoSize)
            ->setPunchoutBackground(true) : null;

        $label = ! empty($this->labelText) ? Label::create($this->labelText)
            ->setTextColor(new Color(255, 0, 0)) : null;

        return $writer->write($qrCode, $logo, $label);
    }
}

```
:::

## Usage

### Controller

```php:no-line-numbers
/**
 * 构建二维码配置.
 * @param ImageRequest $request 验证请求类
 * @return array 关联数组
 */
private function buildQrcodeConfig(ImageRequest $request): array
{
    $logo = $request->file('logo');
    if ($logo !== null) {
        $logoPath = BASE_PATH . '/runtime/upload/' . $logo->getClientFilename();
        $logo->moveTo($logoPath);
    } else {
        $logoPath = '';
    }
    $config = $request->all();
    $config['logo_path'] = $logoPath;

    return $config;
}
```

### Show Qrcode

```php:no-line-numbers
/**
 * 展示二维码
 * @param ImageRequest $request 验证请求类
 * @return MessageInterface|ResponseInterface 流式响应
 * @throws Exception 异常抛出
 */
#[Scene(scene: 'qrcode')]
#[PostMapping(path: 'qrcode/show')]
public function qrcode(ImageRequest $request): MessageInterface|ResponseInterface
{
    $config = $this->buildQrcodeConfig($request);
    $qrCodeString = (new Qrcode($config))->getStream($config['content']);
    $config['logo_path'] !== '' && unlink($config['logo_path']); // 移除logo临时文件

    return $this->response->withHeader('Content-Type', 'image/png')
        ->withBody(new SwooleStream($qrCodeString));
}
```

### Generate a QR

```php:no-line-numbers
/**
 * 制作二维码且上传到OSS返回二维码地址.
 * @param ImageRequest $request 验证请求类
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 * @throws FilesystemException 异常抛出
 */
#[Scene(scene: 'qrcode')]
#[PostMapping(path: 'qrcode/upload')]
public function uploadQrcodeToOss(ImageRequest $request): array
{
    $config = $this->buildQrcodeConfig($request);
    $qrCodeString = (new Qrcode($config))->getStream($config['content']);
    $config['logo_path'] !== '' && unlink($config['logo_path']); // 移除logo临时文件

    $fileFactory = new FileSystem();
    $path = '/img/' . uniqid() . '_qrcode.png';
    $fileFactory->write($path, $qrCodeString);

    return $this->result->setData(['url' => ConstCode::OSS_DOMAIN . $path])->getResult();
}
```

### Download QR

```php:no-line-numbers
/**
 * 下载二维码
 * @param ImageRequest $request 验证请求类
 * @return MessageInterface|ResponseInterface 流式响应
 * @throws Exception 异常抛出
 */
#[Scene(scene: 'qrcode')]
#[PostMapping(path: 'qrcode/download')]
public function downloadQrcode(ImageRequest $request): MessageInterface|ResponseInterface
{
    $config = $this->buildQrcodeConfig($request);
    $qrCodeString = (new Qrcode($config))->getStream($config['content']);
    $config['logo_path'] !== '' && unlink($config['logo_path']); // 移除logo临时文件

    $tmpFilename = uniqid() . '.png';
    return $this->response->withHeader('content-description', 'File Transfer')
        ->withHeader('content-type', 'image/png')
        ->withHeader('content-disposition', "attachment; filename={$tmpFilename}")
        ->withHeader('content-transfer-encoding', 'binary')
        ->withBody(new SwooleStream($qrCodeString));
}
```

---

::: warning 【注意】
PNG and JPG types require support from the `Gd` and `Imagick` libraries.
:::