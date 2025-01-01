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

prev: /us/hyperf/web/convert/aws4
next: /us/hyperf/web/login/jwt
sidebarDepth: 3
---

# RC4

Index

[[toc]]


::: tip
`RC4` is a symmetric encryption algorithm commonly used for data encryption.
Unlike asymmetric encryption, symmetric encryption uses only one key.
:::

---

## Install Dependencies

> [Standard Library Address](https://packagist.org/packages/phpseclib/phpseclib)

```php:no-line-numbers
composer require phpseclib/phpseclib
```

## Encapsulation of Utility Class

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

## Usage

### Encryption

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

### Decryption

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


