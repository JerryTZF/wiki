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

prev: /zh/hyperf/web/convert/aws4
next: /zh/hyperf/web/guzzle
sidebarDepth: 3
---

# RC4

目录

[[toc]]


::: tip 【说明】
`RC4` 是一套对称加密算法，常用于数据加密。\
与非对称加密不同的是：对称加密只有一把秘钥。
:::

---

## 安装扩展包

> [标准库地址](https://packagist.org/packages/phpseclib/phpseclib)

```php:no-line-numbers
composer require phpseclib/phpseclib
```

## 封装工具类

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Encrypt;

use phpseclib3\Crypt\RC4;

class Rc4WithPHPSecLib
{
    /**
     * RC4实例对象.
     */
    private RC4 $RC4;

    /**
     * 秘钥.
     */
    private string $key;

    /**
     * 构造函数.
     */
    public function __construct(string $key = 'abc')
    {
        $this->key = $key;
        $this->RC4 = new RC4();

        $this->RC4->setKey($this->key);
    }

    /**
     * 加密.
     */
    public function encrypt(string|array $message): string
    {
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $message;
        return base64_encode($this->RC4->encrypt($message));
    }

    /**
     * 解密.
     */
    public function decrypt(string $encryptData): string|array
    {
        $decryptData = $this->RC4->decrypt(base64_decode($encryptData));
        return json_decode($decryptData, true) ?? $decryptData;
    }
    
    /**
     * 原生加密.
     */
    public function encryptNative(string|array $message): string
    {
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $message;
        return base64_encode($this->native($this->key, $message));
    }

    /**
     * 原生解密.
     */
    public function decryptNative(string $encryptData): string|array
    {
        $decryptData = $this->native($this->key, base64_decode($encryptData));
        return json_decode($decryptData, true) ?? $decryptData;
    }

    /**
     * 原生算法.
     */
    private function native(string $key, string $data): string
    {
        $cipher = '';
        $keyMap[] = '';
        $box[] = '';
        $pwdLength = strlen($key);
        $data_length = strlen($data);
        for ($i = 0; $i < 256; ++$i) {
            $keyMap[$i] = ord($key[$i % $pwdLength]);
            $box[$i] = $i;
        }
        for ($j = $i = 0; $i < 256; ++$i) {
            $j = ($j + $box[$i] + $keyMap[$i]) % 256;
            $tmp = $box[$i];
            $box[$i] = $box[$j];
            $box[$j] = $tmp;
        }
        for ($a = $j = $i = 0; $i < $data_length; ++$i) {
            $a = ($a + 1) % 256;
            $j = ($j + $box[$a]) % 256;
            $tmp = $box[$a];
            $box[$a] = $box[$j];
            $box[$j] = $tmp;
            $k = $box[($box[$a] + $box[$j]) % 256];
            $cipher .= chr(ord($data[$i]) ^ $k);
        }
        return $cipher;
    }
}

```

## 使用

```php:no-line-numbers
#[GetMapping(path: 'rc4')]
public function rc4(): array
{
    $rc4Instance = new Rc4WithPHPSecLib('hello world');
    $body = ['a' => 'A'];

    $encrypt = $rc4Instance->encrypt($body);
    $decrypt = $rc4Instance->decrypt($encrypt);

    $encrypt_ = $rc4Instance->encryptNative($body);
    $decrypt_ = $rc4Instance->decryptNative($encrypt_);

    return $this->result->setData([
        'encrypt' => $encrypt,
        'decrypt' => $decrypt,
        'encrypt_' => $encrypt_,
        'decrypt_' => $decrypt_,
    ])->getResult();
}
```


