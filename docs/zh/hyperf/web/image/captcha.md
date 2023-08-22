---
sidebar: [
{text: '图像相关', collapsible: true, children: [
{'text': '二维码', link: '/zh/hyperf/web/image/qrcode'},
{'text': '条形码', link: '/zh/hyperf/web/image/barcode'},
{'text': '验证码', link: '/zh/hyperf/web/image/captcha'},
]},
{text: '锁相关', collapsible: true, children: [
{'text': 'Redis分布式锁', link: '/zh/hyperf/web/lock/redis'},
{'text': '数据库悲观锁', link: '/zh/hyperf/web/lock/pessimism'},
{'text': '乐观锁', link: '/zh/hyperf/web/lock/optimistic'},
{'text': '队列(单个消费)', link: '/zh/hyperf/web/lock/queue'},
]},
{text: 'Office相关', collapsible: true, children: [
{'text': '数据导出Excel', link: '/zh/hyperf/web/office/excel'},
{'text': '数据导出Csv', link: '/zh/hyperf/web/office/csv'},
]},
{text: '加解密', collapsible: true, children: [
{'text': 'AES', link: '/zh/hyperf/web/convert/aes'},
{'text': 'RSA', link: '/zh/hyperf/web/convert/rsa'},
{'text': 'AWS4', link: '/zh/hyperf/web/convert/aws4'},
{'text': 'RC4', link: '/zh/hyperf/web/convert/rc4'},
]},
{text: 'GuzzleHttp', 'link': '/zh/hyperf/web/guzzle'}
]

prev: /zh/hyperf/web/image/barcode
next: /zh/hyperf/web/lock/redis
sidebarDepth: 3
---

# 验证码

目录

[[toc]]

## 安装依赖包

> [标准库地址](https://packagist.org/packages/gregwar/captcha)

::: warning 【注意】
如果 <Badge type="tip" text="PHP8.0+" vertical="middle" />, 需要加载最新版本依赖包。详情参见：[issues#110](https://github.com/Gregwar/Captcha/issues/110)
:::

 ```shell:no-line-numbers
composer require gregwar/captcha
```

## 封装工具类

::: details 查看代码
```php
<?php

declare(strict_types=1);
namespace App\Lib\Image;

use App\Lib\Redis\Redis;
use Gregwar\Captcha\CaptchaBuilder;
use Gregwar\Captcha\PhraseBuilder;

class Captcha
{
    /**
     * 获取验证
     * @param string $clientUniqueCode 不同的客户端使用不同的唯一标识
     */
    public function getStream(string $clientUniqueCode): string
    {
        // 验证码长度和范围
        $phrase = new PhraseBuilder(4, 'abcdefghijklmnpqrstuvwxyz123456789');
        // 初始化验证码
        $builder = new CaptchaBuilder(null, $phrase);
        // 创建验证码
        $builder->build();
        // 获取验证码内容
        $phrase = $builder->getPhrase();
        // 写入Redis,以便验证
        $redis = Redis::getRedis();
        $redis->del($clientUniqueCode);
        $redis->set($clientUniqueCode, $phrase, ['NX', 'EX' => 300]);

        return $builder->get();
    }

    /**
     * 验证验证码
     */
    public function verify(string $captcha, string $clientUniqueCode): bool
    {
        $redis = Redis::getRedis();
        $cachedCaptcha = $redis->get($clientUniqueCode);
        if ($cachedCaptcha === $captcha) {
            $redis->del($clientUniqueCode);
            return true;
        }
        return false;
    }
}

```
:::

## 使用

```php:no-line-numbers
#[GetMapping(path: 'captcha/stream')]
public function captcha(): MessageInterface|ResponseInterface
{
    $clientCode = '187.091.123,111';
    $captchaString = (new Captcha())->getStream($clientCode);
    return $this->response->withHeader('Content-Type', 'image/png')
        ->withBody(new SwooleStream($captchaString));
}

#[GetMapping(path: 'captcha/verify')]
public function verify(): array
{
    $clientCode = '187.091.123,111';
    $captcha = $this->request->input('captcha', 'xxxx');
    $isPass = (new Captcha())->verify($captcha, $clientCode);
    if (! $isPass) {
        return $this->result->setErrorInfo(
            ErrorCode::CAPTCHA_ERROR,
            ErrorCode::getMessage(ErrorCode::CAPTCHA_ERROR)
        )->getResult();
    }
    return $this->result->getResult();
} 
```