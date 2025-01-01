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

prev: /us/hyperf/web/office/csv
next: /us/hyperf/web/convert/rsa
sidebarDepth: 3
---

# AES

目录

[[toc]]

::: tip 【Description】
AES is a symmetric encryption algorithm commonly used for data encryption. Unlike asymmetric encryption, symmetric encryption uses a single key.
:::

## Core Elements

- Data to be encrypted.
- Cryptographic mode (`cipher`): Common modes include `ECB`, `CBC`, `CFB`, `OFB`, etc.
- Key: Symmetric encryption uses a single key for both encryption and decryption. The key length has specific requirements, typically: 128 bits (16 bytes), 192 bits (24 bytes), or 256 bits (32 bytes).
- Padding scheme (`padding`): The core of AES encryption is based on block encryption. When the length is insufficient for the block size, padding is required at the end.
  - `NoPadding`: No padding is applied, but the plaintext must be a multiple of 16 bytes.
  - `PKCS5Padding`、`PKCS7Padding`: If the plaintext block is less than 16 bytes (128 bits), the missing number of characters will be added at the end of the block, with each byte's value equal to the number of missing characters.
  - `ISO10126Padding`: If the plaintext block is less than 16 bytes (128 bits), the missing number of bytes will be added at the end of the block. The last byte's value equals the number of missing bytes, and the other bytes are filled with random values.
- Initialization Vector(`iv`)：Different cryptographic modes require different lengths of initialization vectors to assist in calculations.

---

## Function Explanation

::: warning
---
<Badge type="tip" text="PHP7.0+" vertical="middle" /> use `openssl_encrypt()` function。and support <Badge type="tip" text="openssl" vertical="middle" />。
---
:::

> **`$data`**: The string to be encrypted. \
> **`$cipher_algo`**: The cryptographic method. You can retrieve a list of valid cipher methods using `openssl_get_cipher_methods()`. \
> **`$passphrase`**: The key. Note that PHP automatically applies padding, whereas Java uses "\0" for padding.\
> **`$options`**: The padding scheme. `OPENSSL_RAW_DATA` (PKCS5Padding | PKCS7Padding), `OPENSSL_ZERO_PADDING` (NoPadding). \
> **`$iv`**:  The initialization vector. Different cryptographic methods require different lengths of `IV`. You can check the required length using `openssl_cipher_iv_length($cipher_algo)`. \
> **`$tag`**: The authentication tag passed by reference when using AEAD modes (GCM or CCM).
> **`$add`**: Additional authenticated data.
> **`$tag_length`**: The length of the authentication tag. In GCM mode, it ranges from 4 to 16.
---

```php:no-line-numbers
function openssl_encrypt(
  string $data, 
  string $cipher_algo, 
  string $passphrase, 
  int $options = 0, 
  string $iv = "", 
  &$tag, 
  string $aad = "", 
  int $tag_length = 16
): string|false {}
```

---

## Points to Note When Interchanging with Other Languages

- The key length in PHP is automatically padded to the specified length, but other languages may use different padding algorithms, so it needs to be verified.
- When the initialization vector (IV) length needs to be padded to a specific length, ensure it is consistent with the method used in other languages.
- It is recommended to use `PKCS7Padding` for padding across all languages.

## Code Encapsulation

### Native OpenSSL

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Encrypt;

class AES
{
    /**
     * ecb方式加密. (不需要偏移量 && 默认 PKCS7Padding 填充方式).
     * @param array|string $data 待加密的数据
     * @param string $key 秘钥
     */
    public static function ecbEncryptHex(array|string $data, string $key, string $cipher = 'AES-128-ECB'): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        $padding = OPENSSL_RAW_DATA;
        return bin2hex(openssl_encrypt($data, $cipher, $key, $padding));
    }

    /**
     * ecb方式解密. (不需要偏移量 && 默认 PKCS7Padding 填充方式).
     */
    public static function ecbDecryptHex(string $encryptData, string $key, string $cipher = 'AES-128-ECB'): string|array
    {
        $padding = OPENSSL_RAW_DATA;
        $decrypt = openssl_decrypt(hex2bin($encryptData), $cipher, $key, $padding);
        return json_decode($decrypt, true) ?? $decrypt;
    }

    /**
     * ecb方式加密. (不需要偏移量 && 默认 PKCS7Padding 填充方式).
     */
    public static function ecbEncryptBase64(array|string $data, string $key, string $cipher = 'AES-128-ECB'): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        $padding = OPENSSL_RAW_DATA;
        return base64_encode(openssl_encrypt($data, $cipher, $key, $padding));
    }

    /**
     * ecb方式解密. (不需要偏移量 && 默认 PKCS7Padding 填充方式).
     */
    public static function ecbDecryptBase64(string $encryptData, string $key, string $cipher = 'AES-128-ECB'): string|array
    {
        $padding = OPENSSL_RAW_DATA;
        $decrypt = openssl_decrypt(base64_decode($encryptData), $cipher, $key, $padding);
        return json_decode($decrypt, true) ?? $decrypt;
    }

    /**
     * CBC方式加密(PKCS7Padding 填充方式).
     */
    public static function cbcEncryptHex(array|string $data, string $key, string $iv, string $cipher = 'AES-128-CBC'): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        $padding = OPENSSL_RAW_DATA;
        $iv = md5($iv, true); // 注意别的语言是否是这种方式固定16位长度!!!
        return bin2hex(openssl_encrypt($data, $cipher, $key, $padding, $iv));
    }

    /**
     * CBC方式解密(PKCS7Padding 填充方式).
     */
    public static function cbcDecryptHex(string $encryptData, string $key, string $iv, string $cipher = 'AES-128-CBC'): string|array
    {
        $padding = OPENSSL_RAW_DATA;
        $iv = md5($iv, true); // 注意别的语言是否是这种方式固定16位长度!!!
        $decrypt = openssl_decrypt(hex2bin($encryptData), $cipher, $key, $padding, $iv);
        return json_decode($decrypt, true) ?? $decrypt;
    }

    /**
     * CBC方式加密(PKCS7Padding 填充方式).
     */
    public static function cbcEncryptBase64(array|string $data, string $key, string $iv, string $cipher = 'AES-128-CBC'): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        $padding = OPENSSL_RAW_DATA;
        $iv = md5($iv, true); // 注意别的语言是否是这种方式固定16位长度!!!
        return base64_encode(openssl_encrypt($data, $cipher, $key, $padding, $iv));
    }

    /**
     * CBC方式解密(PKCS7Padding 填充方式).
     */
    public static function cbcDecryptBase64(string $encryptData, string $key, string $iv, string $cipher = 'AES-128-CBC'): string|array
    {
        $padding = OPENSSL_RAW_DATA;
        $iv = md5($iv, true); // 注意别的语言是否是这种方式固定16位长度!!!
        $decrypt = openssl_decrypt(base64_decode($encryptData), $cipher, $key, $padding, $iv);
        return json_decode($decrypt, true) ?? $decrypt;
    }
}

```
:::

---

### PhpSeclib

**1、Install Dependency Packages**

> [Standard Library Address](https://packagist.org/packages/phpseclib/phpseclib)

```php:no-line-numbers
composer require phpseclib/phpseclib
```

---

**2、Encapsulation of Exception Handler**

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use LogicException;
use Psr\Http\Message\ResponseInterface;
use RuntimeException;
use Throwable;

/**
 * PHPSeclib包异常处理器.
 * Class PHPSeclibExceptionHandler.
 */
class PHPSeclibExceptionHandler extends ExceptionHandler
{
    /**
     * 处理类.
     * @param Throwable $throwable 异常
     * @param ResponseInterface $response 响应接口实现类
     * @return ResponseInterface 响应接口实现类
     */
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        // 禁止异常冒泡
        $this->stopPropagation();

        return $response->withHeader('Content-Type', 'application/json')
            ->withStatus(200)->withBody(new SwooleStream(json_encode([
                'code' => SystemCode::PHPSECLIB_ERR,
                'msg' => SystemCode::getMessage(SystemCode::PHPSECLIB_ERR, [$throwable->getMessage()]),
                'status' => false,
                'data' => [],
            ], JSON_UNESCAPED_UNICODE)));
    }

    /**
     * 是否满足处理条件.
     * @param Throwable $throwable 异常
     * @return bool true|false
     */
    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof LogicException || $throwable instanceof RuntimeException;
    }
}

```

---

**3、Registering Exception Handler**

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handler' => [
        'http' => [
            ...
            // PHPSeclib 包异常捕获
            App\Exception\Handler\PHPSeclibExceptionHandler::class,
            ...
        ],
    ],
];
```

---

**4、Encapsulation of PhpSeclib**

::: details Detail
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Encrypt;

use phpseclib3\Crypt\Common\SymmetricKey;

class AesWithPHPSeclib
{
    /**
     * aes实例.
     * @var \phpseclib3\Crypt\AES 实例
     */
    private \phpseclib3\Crypt\AES $aesInstance;

    /**
     * 构造函数.
     */
    public function __construct(string $mode, int $keyLength, string $key, array $options = [])
    {
        $mode = strtolower($mode);
        $aesInstance = new \phpseclib3\Crypt\AES($mode);
        $aesInstance->setPreferredEngine(SymmetricKey::ENGINE_OPENSSL);
        $aesInstance->setKeyLength($keyLength);
        $aesInstance->enablePadding();

        // ecb 和 gcm 不用添加 $iv
        if (! in_array(SymmetricKey::MODE_MAP[$mode], [SymmetricKey::MODE_GCM, SymmetricKey::MODE_ECB])) {
            // 注意别的语言是否是这种方式固定16位长度!!!
            $iv = md5($options['iv'] ?? '', true);
            $aesInstance->setIV($iv);
        }

        // 只有gcm 才有tag、nonce、aad
        if (SymmetricKey::MODE_MAP[$mode] === SymmetricKey::MODE_GCM) {
            $aesInstance->setTag($options['tag'] ?? '');
            $aesInstance->setNonce($options['nonce'] ?? '');
            $aesInstance->setAAD($options['aad'] ?? '');
        }

        $aesInstance->setKey($key);
        $this->aesInstance = $aesInstance;
    }

    /**
     * 加密输出Hex字符串.
     * @param array|string $data 待加密数据
     * @return string 加密后数据
     */
    public function encryptHex(array|string $data): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        return bin2hex($this->aesInstance->encrypt($data));
    }

    /**
     * 解密Hex字符串.
     * @param string $decryptText 待解密数据
     * @return array|string 解密后数据
     */
    public function decryptHex(string $decryptText): array|string
    {
        $data = $this->aesInstance->decrypt(hex2bin($decryptText));
        return json_decode($data, true) ?? $data;
    }

    /**
     * 加密输出base64字符串.
     * @param array|string $data 带加密数据
     * @return string 加密后数据
     */
    public function encryptBase64(array|string $data): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        return base64_encode($this->aesInstance->encrypt($data));
    }

    /**
     * 解密Base64字符串.
     * @param string $decryptText 待解密数据
     * @return array|string 解密后数据
     */
    public function decryptBase64(string $decryptText): array|string
    {
        $data = $this->aesInstance->decrypt(base64_decode($decryptText));
        return json_decode($data, true) ?? $data;
    }
}

```
:::

---

## Usage

::: tabs
@tab AES Encryption
```php:no-line-numbers
/**
 * AES加密数据.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'aes/encrypt')]
#[Scene(scene: 'aes')]
public function aesEncrypt(EncryptRequest $request): array
{
    [$key, $cipherType, $cipherLength, $type, $option, $data] = [
        $request->input('key'), // 秘钥
        $request->input('cipher_type', 'ecb'), // 密码类型
        intval($request->input('cipher_length', 256)), // 密码学长度
        $request->input('output_type', 'base64'), // 加密后转换类型(支持hex和base64)
        $request->input('option'), // 不同的密码类型所需要的参数也不一样
        $request->input('data'),
    ];

    $seclib = new AesWithPHPSeclib($cipherType, $cipherLength, $key, $option);
    $result = $type === 'base64' ? $seclib->encryptBase64($data) : $seclib->encryptHex($data);
    return $this->result->setData(['encrypt_result' => $result])->getResult();
}
```
@tab AES Decryption
```php:no-line-numbers
/**
 * AES解密.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'aes/decrypt')]
#[Scene(scene: 'aes')]
public function aesDecrypt(EncryptRequest $request): array
{
    [$key, $cipherType, $cipherLength, $type, $option, $encryptText] = [
        $request->input('key'), // 秘钥
        $request->input('cipher_type', 'ecb'), // 密码类型
        intval($request->input('cipher_length', 256)), // 密码学长度
        $request->input('output_type', 'base64'), // 加密后转换类型(支持hex和base64)
        $request->input('option'), // 不同的密码类型所需要的参数也不一样
        $request->input('data'),
    ];

    $seclib = new AesWithPHPSeclib($cipherType, $cipherLength, $key, $option);
    $result = $type === 'base64' ? $seclib->decryptBase64($encryptText) : $seclib->decryptHex($encryptText);
    return $this->result->setData(['decrypt_result' => $result])->getResult();
}
```
:::
