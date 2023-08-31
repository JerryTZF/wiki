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
]

prev: /zh/hyperf/web/office/csv
next: /zh/hyperf/web/convert/rsa
sidebarDepth: 3
---

# AES

目录

[[toc]]

::: tip 【说明】
`AES` 是一套对称加密算法，常用于数据加密。\
与非对称加密不同的是：对称加密只有一把秘钥。
:::

## 核心要素

- 待加密的数据。
- 密码学方式(`cipher`)：常见的有：`ECB`、`CBC`、`CFB`、`OFB` 等。
- 秘钥(`key`)：对称加密都会有一个秘钥来进行加密和解密。秘钥长度有特定要求，一般为：`128位`、`192位`、`256位`。
- 填充方式(`padding`)：`AES` 加密核心是通过分组加密的方式进行加密，那么在末尾长度不足每块的长度时，应该如何填充。
  - `NoPadding`: 不做任何填充，但是要求明文必须是16字节的整数倍。
  - `PKCS5Padding`、`PKCS7Padding`: 如果明文块少于16个字节（128bit），在明文块末尾补足相应数量的字符，且每个字节的值等于缺少的字符数。
  - `ISO10126Padding`: 如果明文块少于16个字节（128bit），在明文块末尾补足相应数量的字节，最后一个字符值等于缺少的字符数，其他字符填充随机数。
- 偏移量(`iv`)：不同的密码学方式会需要不同长度的偏移量进行辅助计算。

---

## 函数解释

::: warning 【注意】
---
<Badge type="tip" text="PHP7.0+" vertical="middle" /> 使用 `openssl_encrypt()` 函数。且支持 <Badge type="tip" text="openssl" vertical="middle" />。
---
:::

> **`$data`**: 带加密的字符串。\
> **`$cipher_algo`**: 密码学方式。`openssl_get_cipher_methods()` 可获取有效密码方式列表。 \
> **`$passphrase`**: 秘钥。注意PHP会自动填充, 需要注意 JAVA 中是使用 "\0" 进行填充。\
> **`$options`**: 填充方式。OPENSSL_RAW_DATA (PKCS5Padding | PKCS7Padding)、 OPENSSL_ZERO_PADDING(NoPadding)。 \
> **`$iv`**: 偏移量。不同的密码学方式，需要的偏移量长度不一致。可使用 `openssl_cipher_iv_length($cipher_algo)` 查看。\
> **`$tag`**: 使用 AEAD 密码模式（GCM 或 CCM）时传引用的验证标签。
> **`$add`**: 附加的验证数据。
> **`$tag_length`**: 验证 tag 的长度。GCM 模式时，它的范围是 4 到 16。
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

## 和其他语言相互换转注意点

- PHP的秘钥长度时自动补充到指定长度，但是其他语言的补充算法和PHP可能不一样，需要确定。
- 偏移量长度需要补充到指定长度时，需要和其他语言保持方式一致。
- 填充方式最好均使用 `PKCS7Padding`。

## 代码封装

### 原生OpenSSL

::: details 查看代码
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

### PhpSeclib 扩展包

**1、安装依赖包**

> [标准库地址](https://packagist.org/packages/phpseclib/phpseclib)

```php:no-line-numbers
composer require phpseclib/phpseclib
```

---

**2、封装异常处理器**

```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Exception\Handler;

use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use LogicException;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class PHPSeclibExceptionHandler extends ExceptionHandler
{
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

    public function isValid(Throwable $throwable): bool
    {
        return $throwable instanceof LogicException;
    }
}

```

---

**3、注册异常处理器**

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

**4、封装PhpSeclib**

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Encrypt;

use phpseclib3\Crypt\Common\SymmetricKey;

class AesWithPHPSeclib
{
    /**
     * aes实例.
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
     */
    public function encryptHex(array|string $data): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        return bin2hex($this->aesInstance->encrypt($data));
    }

    /**
     * 解密Hex字符串.
     */
    public function decryptHex(string $decryptText): string|array
    {
        $data = $this->aesInstance->decrypt(hex2bin($decryptText));
        return json_decode($data, true) ?? $data;
    }

    /**
     * 加密输出base64字符串.
     */
    public function encryptBase64(array|string $data): string
    {
        $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
        return base64_encode($this->aesInstance->encrypt($data));
    }

    /**
     * 解密Base64字符串.
     */
    public function decryptBase64(string $decryptText): string|array
    {
        $data = $this->aesInstance->decrypt(base64_decode($decryptText));
        return json_decode($data, true) ?? $data;
    }
}

```
:::

---

## 使用

```php:no-line-numbers
#[GetMapping(path: 'aes')]
public function aes(): array
{
    // ecb 加密解密
    $data = ['key' => 'AES', 'msg' => '待加密数据'];
    $key = 'KOQ19sd3_1kaseq/';
    $iv = 'hello world';
    $ecbEncryptHex = AES::ecbEncryptHex($data, $key, 'AES-128-ECB');
    $ecbDecryptHex = AES::ecbDecryptHex($ecbEncryptHex, $key, 'AES-128-ECB');
    var_dump($ecbEncryptHex, $ecbDecryptHex);
    $ecbEncryptBase64 = AES::ecbEncryptBase64($data, $key, 'AES-128-ECB');
    $ecbDecryptBase64 = AES::ecbDecryptBase64($ecbEncryptBase64, $key, 'AES-128-ECB');
    var_dump($ecbEncryptBase64, $ecbDecryptBase64);

    // cbc 加解密
    $cbcEncryptHex = AES::cbcEncryptHex($data, $key, $iv, 'AES-128-CBC');
    $cbcDecryptHex = AES::cbcDecryptHex($cbcEncryptHex, $key, $iv, 'AES-128-CBC');
    var_dump($cbcEncryptHex, $cbcDecryptHex);
    $cbcEncryptBase64 = AES::cbcEncryptBase64($data, $key, $iv, 'AES-128-CBC');
    $cbcDecryptBase64 = AES::cbcDecryptBase64($cbcEncryptBase64, $key, $iv, 'AES-128-CBC');
    var_dump($cbcEncryptBase64, $cbcDecryptBase64);

    return $this->result->getResult();
}
```

---

```php:no-line-numbers
#[GetMapping(path: 'seclib/aes')]
  public function seclibAes(): array
  {
      $constructEcb = [
          'ecb', 128, 'KOQ19sd3_1kaseq/', [],
      ];
      $constructCbc = [
          'cbc', 128, 'KOQ19sd3_1kaseq/', ['iv' => 'hello world'],
      ];
      $data = ['key' => 'Aes', 'msg' => '待加密数据'];
      $aesInstance = new AesWithPHPSeclib(...$constructCbc);
      $ecbEncryptHex = $aesInstance->encryptHex($data);
      $ecbDecryptHex = $aesInstance->decryptHex($ecbEncryptHex);
      var_dump($ecbEncryptHex, $ecbDecryptHex);
      $ecbEncryptBase64 = $aesInstance->encryptBase64($data);
      $ecbDecryptBase64 = $aesInstance->decryptBase64($ecbEncryptBase64);
      var_dump($ecbEncryptBase64, $ecbDecryptBase64);

      return $this->result->getResult();
  }
```