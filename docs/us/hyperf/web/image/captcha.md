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

prev: /us/hyperf/web/image/barcode
next: /us/hyperf/web/lock/redis
sidebarDepth: 3
---

# Captcha

Index

[[toc]]

## Install Dependencies

> [Standard Library Address](https://packagist.org/packages/gregwar/captcha)

::: warning
If <Badge type="tip" text="PHP8.0+" vertical="middle" />, the latest version of the dependency package needs to be loaded. For more details, refer to: [issues#110](https://github.com/Gregwar/Captcha/issues/110).
:::

```shell:no-line-numbers
composer require gregwar/captcha
```

## Encapsulate Utility Class

::: details 查看代码
```php
<?php

declare(strict_types=1);
namespace App\Lib\Image;

use Gregwar\Captcha\CaptchaBuilder;
use Gregwar\Captcha\PhraseBuilder;
use Hyperf\Context\ApplicationContext;
use Hyperf\Redis\Redis;

class Captcha
{
    /**
     * redis 实例.
     * @var mixed|Redis Redis实例
     */
    private Redis $redis;

    public function __construct()
    {
        $this->redis = ApplicationContext::getContainer()->get(Redis::class);
    }

    /**
     * 获取验证
     * @param string $clientUniqueCode 不同的客户端使用不同的唯一标识
     * @return string 文件流字符串
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
        $this->redis->del($clientUniqueCode);
        $this->redis->set($clientUniqueCode, $phrase, ['NX', 'EX' => 300]);

        return $builder->get();
    }

    /**
     * 验证验证码
     * @param string $captcha 验证码
     * @param string $clientUniqueCode 唯一码
     * @return bool 是否验证通过
     */
    public function verify(string $captcha, string $clientUniqueCode): bool
    {
        $cachedCaptcha = $this->redis->get($clientUniqueCode);
        if ($cachedCaptcha === $captcha) {
            $this->redis->del($clientUniqueCode);
            return true;
        }
        return false;
    }
}

```
:::

## Usage

```php:no-line-numbers
/**
 * 获取验证码.
 * @param ImageRequest $request 验证请求类
 * @return MessageInterface|ResponseInterface 流式响应
 */
#[Scene(scene: 'captcha')]
#[GetMapping(path: 'captcha/show')]
public function getCaptcha(ImageRequest $request): MessageInterface|ResponseInterface
{
    $ip = $this->getRequestIp();
    $uniqueCode = $request->input('captcha_unique_code');
    $unique = $ip . '_' . $uniqueCode;
    $captchaString = (new Captcha())->getStream($unique);

    return $this->response->withHeader('Content-Type', 'image/png')
        ->withBody(new SwooleStream($captchaString));
}

/**
 * 验证验证码.
 * @param ImageRequest $request 验证请求类
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[Scene(scene: 'verify')]
#[GetMapping(path: 'captcha/verify')]
public function verifyCaptcha(ImageRequest $request): array
{
    $ip = $this->getRequestIp();
    $uniqueCode = $request->input('captcha_unique_code');
    $unique = $ip . '_' . $uniqueCode;
    $captchaCode = $request->input('captcha');

    $isSuccess = (new Captcha())->verify($captchaCode, $unique);
    return $this->result->setData(['is_success' => $isSuccess])->getResult();
}
```