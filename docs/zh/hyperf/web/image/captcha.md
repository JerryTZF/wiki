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

## 使用

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