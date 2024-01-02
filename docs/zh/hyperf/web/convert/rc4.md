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
{text: '🍪 登录相关', collapsible: true, children: [
{'text': 'JWT', link: '/zh/hyperf/web/login/jwt'},
{'text': 'Cookie', link: '/zh/hyperf/web/login/cookie'},
{'text': 'Session', link: '/zh/hyperf/web/login/session'},
{'text': 'Q&A', link: '/zh/hyperf/web/login/qa'},
]},
{text: '📀 服务部署', collapsible: true, children: [
{'text': '说明', link: '/zh/hyperf/web/deployment/description'},
{'text': '部署流程', link: '/zh/hyperf/web/deployment/detail'},
]},
]

prev: /zh/hyperf/web/convert/aws4
next: /zh/hyperf/web/login/jwt
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

::: details
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Encrypt;

use phpseclib3\Crypt\RC4;

class Rc4WithPHPSecLib
{
    /**
     * RC4实例对象.
     * @var RC4 rc4实例
     */
    private RC4 $RC4;

    /**
     * 秘钥.
     * @var string ''
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
        // TODO $RC4 还有一些设置IV等, 这里不作展开 :)
    }

    /**
     * 加密.
     * @param array|string $message 待加密数据
     * @return string 加密后数据
     */
    public function encrypt(array|string $message): string
    {
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $message;
        return base64_encode($this->RC4->encrypt($message));
    }

    /**
     * 解密.
     * @param string $encryptData 待解密数据
     * @return array|string 解密后数据
     */
    public function decrypt(string $encryptData): array|string
    {
        $decryptData = $this->RC4->decrypt(base64_decode($encryptData));
        return json_decode($decryptData, true) ?? $decryptData;
    }

    /**
     * 原生加密.
     * @param array|string $message 待加密数据
     * @return string 加密后数据
     */
    public function encryptNative(array|string $message): string
    {
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $message;
        return base64_encode($this->native($this->key, $message));
    }

    /**
     * 原生解密.
     * @param string $encryptData 待解密数据
     * @return array|string 解密后数据
     */
    public function decryptNative(string $encryptData): array|string
    {
        $decryptData = $this->native($this->key, base64_decode($encryptData));
        return json_decode($decryptData, true) ?? $decryptData;
    }

    /**
     * 原生算法.
     * @param string $key 秘钥
     * @param string $data 待解密数据
     * @return string 加密后数据
     */
    private function native(string $key, string $data): string
    {
        $cipher = '';
        $keyMap[] = '';
        $box[] = '';
        $pwdLength = strlen($key);
        $dataLength = strlen($data);
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
        for ($a = $j = $i = 0; $i < $dataLength; ++$i) {
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
:::

## 使用

### 加密

```php:no-line-numbers
/**
 * RC4加密.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'rc4/encrypt')]
#[Scene(scene: 'rc4')]
public function rc4Encrypt(EncryptRequest $request): array
{
    $key = $request->input('key');
    $data = $request->input('data');
    $rc4 = new Rc4WithPHPSecLib($key);
    $result = $rc4->encrypt($data);
    return $this->result->setData(['encrypt_result' => $result])->getResult();
}
```

---

### 解密

```php:no-line-numbers
/**
 * RC4解密.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'rc4/decrypt')]
#[Scene(scene: 'rc4')]
public function rc4Decrypt(EncryptRequest $request): array
{
    $key = $request->input('key');
    $data = $request->input('data');
    $rc4 = new Rc4WithPHPSecLib($key);
    $result = $rc4->decrypt($data);
    return $this->result->setData(['decrypt_result' => $result])->getResult();
}
```


