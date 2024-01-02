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

prev: /zh/hyperf/web/convert/aes
next: /zh/hyperf/web/convert/aws4
sidebarDepth: 3
---

# RSA

目录

[[toc]]

## 核心概念

***1、对称加密***

> 通信双方持有同一个 `秘钥` 使用 `算法` 对传输的数据进行加解密。 
> 常见的算法有：`AES`、`DES`、`RC4`等。
---
***2、非对称加密***
> 非对称加密算法中信息的发送方和接收方都分别有两个密钥，其中分别为 `私钥` 和 `公钥`。`私钥` 
> 为数据的发送方持有，`公钥`可以公开。常见的算法为 `RSA`。
---
***3、RSA算法规则***
> - 私钥加密的数据只有对应的公钥可以解密，公钥加密的数据只有对应的私钥可以解密。
> - 私钥可以生成公钥，但是公钥无法生私钥。
> - **<font color="red">「公钥」对数据加密，用「私钥」解密，称为 ***`加解密`*** ; 「私钥」对数据加密，用「公钥」解密，称为 ***`加签、验签`***。</font>**
 
---
***4、摘要***
> 对一份数据，进行一个***单向***的 `Hash` 函数，生成一个固定长度的 `Hash` 值，这个值就是这份数据的摘要，也称为指纹。
> 且数据有任何变动，最终的 `Hash` 值就会不一致。
---
***5、数字签名***
> 用于保证数据完整性、合法数据源的签名字段。即保证：数据不允许被篡改，不允许其他人假冒自己传输数据。
> `RSA` 的私钥签名保证其不可冒充。
---
***6、数字证书***

> 数字签名主要用来验证数据完整性和认证数据来源，而数字证书主要用来安全地发放公钥。 数字证书主要包含三个部分：用户的信息、用户的公钥和 CA 对该证书实体信息的签名

## 通信过程

***假设 `A`和`B`想要安全的通信：***

> 1、**A** 生成一对秘钥对：`privateKeyA`、`publicKeyA`；**B** 生成一对秘钥对：`privateKeyB`、`publicKeyB`。\
> 2、**A** 发放 `publicKeyA` 给到 **B**，**B** 发放 `publicKeyB` 给到 **A**。此时 **A** 拥有 `privateKeyA`和`publicKeyB`，**B** 拥有
`privateKeyB`和`publicKeyA`。\
> 3、**A** 对 `明文A` 进行 ***摘要计算***，得到 `DigestA` (防止数据篡改)，此时再用 `privateKeyA` 对 `DigestA` 进行 ***加签*** 
得到 `SignA` (确保是**A**发送的数据)，同时 **A** 用 `privateKeyA` 对 `明文A` 加密得到 `密文A`。此时将 `密文A` 和 `SignA` 发送给 **B**。\
> 4、**B** 收到 `密文A` 和 `SignA` 后，使用 `publicKeyA` 对 `密文A` 解密得到 `明文A` ，对 `明文A` 进行 ***摘要计算*** 得到 `DigestB`。
> 同时使用 `publicKeyA` 对 `SignA` 进行解密得到 `DigestA`，比较 `DigestA` 和 `DigestB` 是否相同。

---

::: tip 【流程图】
![](https://img.tzf-foryou.xyz/img/20230825154528.png)
:::

## 封装工具类

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Encrypt;

use phpseclib3\Crypt\RSA;
use phpseclib3\Crypt\RSA\PrivateKey;

// 在线工具测试:
// https://try8.cn/tool/cipher/rsa
class RsaWithPHPSeclib
{
    /**
     * RSA私钥实例.
     */
    private RSA|PrivateKey $privateKey;

    /**
     * 秘钥保存路径.
     */
    private string $path;

    /**
     * 秘钥保存格式(PKCS8|PKCS1).
     * @see https://phpseclib.com/docs/publickeys#saving-keys
     */
    private string $keyFormat;

    /**
     * 可用的hash算法.
     */
    private array $availableHash = ['md2', 'md5', 'sha1', 'sha256', 'sha384', 'sha512', 'sha224'];

    /**
     * 可用的加密填充方式.
     */
    private array $availableEncryptPadding = [RSA::ENCRYPTION_OAEP, RSA::ENCRYPTION_PKCS1, RSA::ENCRYPTION_NONE];

    /**
     * 私钥加签可用的填充方式.
     */
    private array $availableSignaturePadding = [RSA::SIGNATURE_PKCS1, RSA::SIGNATURE_PSS, RSA::SIGNATURE_RELAXED_PKCS1];

    /**
     * 加解密填充方式(RSA::ENCRYPTION_OAEP, RSA::ENCRYPTION_PKCS1, RSA::ENCRYPTION_NONE).
     * @see https://phpseclib.com/docs/rsa#encryption--decryption
     */
    private int $encryptPadding;

    /**
     * 私钥加签填充方式.
     * @see https://phpseclib.com/docs/rsa#creating--verifying-signatures
     */
    private int $signaturePadding;

    /**
     * 加解(解密)|加签(验签) 单向HASH算法('md2', 'md5', 'sha1', 'sha256', 'sha384', 'sha512', 'sha224').
     */
    private string $hash;

    /**
     * 加解(解密)|加签(验签) 单向mgfHASH算法('md2', 'md5', 'sha1', 'sha256', 'sha384', 'sha512', 'sha224').
     */
    private string $mgfHash;

    /**
     * 构造函数.
     */
    public function __construct(
        string $password = null,
        int $length = 2048,
        string $keyFormat = 'PKCS8',
        int $encryptPadding = RSA::ENCRYPTION_PKCS1,
        string $encryptHash = 'sha256',
        string $encryptMgfHash = 'sha256',
        int $signaturePadding = RSA::SIGNATURE_PKCS1,
    ) {
        $privateKey = RSA::createKey($length);
        if ($password !== null) {
            $privateKey = $privateKey->withPassword($password);
        }

        $this->privateKey = $privateKey;
        $this->path = BASE_PATH . '/runtime/openssl/';
        $this->keyFormat = $keyFormat;
        $this->encryptPadding = $encryptPadding;
        $this->hash = $encryptHash;
        $this->mgfHash = $encryptMgfHash;
        $this->signaturePadding = $signaturePadding;

        if (! is_dir($this->path)) {
            mkdir(iconv('GBK', 'UTF-8', $this->path), 0755);
        }

        // 初步创建并保存秘钥
        $this->createKeys();
    }

    /**
     * 公钥加密.
     */
    public function publicKeyEncrypt(string|array $message): string
    {
        $privateKey = $this->buildPrivateKey('encrypt');
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $message;
        return base64_encode($privateKey->getPublicKey()->encrypt($message));
    }

    /**
     * 私钥解密.
     */
    public function privateKeyDecrypt(string $encryptText): array|string
    {
        $privateKey = $this->buildPrivateKey('encrypt');
        $decryptData = $privateKey->decrypt(base64_decode($encryptText));
        return json_decode($decryptData, true) ?? $decryptData;
    }

    /**
     * 私钥加签.
     */
    public function privateKeySign(string|array $message): string
    {
        $privateKey = $this->buildPrivateKey('signature');
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $message;
        return base64_encode($privateKey->sign($message));
    }

    /**
     * 公钥验签.
     */
    public function publicKeyVerifySign(string|array $message, string $signature): bool
    {
        $privateKey = $this->buildPrivateKey('signature');
        $message = is_array($message) ? json_encode($message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $message;
        return $privateKey->getPublicKey()->verify($message, base64_decode($signature));
    }

    /**
     * 创建公私钥对(不存在才会创建, 不会覆盖).
     */
    private function createKeys(): void
    {
        [$publicKey, $privateKey] = [
            $this->path . 'public.pem',
            $this->path . 'private.pem',
        ];
        if (! file_exists($publicKey) || ! file_exists($privateKey)) {
            file_put_contents($privateKey, $this->privateKey->toString($this->keyFormat));
            file_put_contents($publicKey, $this->privateKey->getPublicKey()->toString($this->keyFormat));
        }
    }

    /**
     * 构建不同场景下的合法私钥.
     * @param string $mode
     * @return PrivateKey|RSA
     */
    private function buildPrivateKey(string $mode = 'encrypt'): PrivateKey|RSA
    {
        /** @var PrivateKey|RSA $privateKey */
        $privateKey = RSA::loadPrivateKey(file_get_contents($this->path . 'private.pem'));
        if ($mode === 'encrypt') {
            // 加签填充方式
            $privateKey = in_array($this->signaturePadding, $this->availableSignaturePadding) ?
                $privateKey->withPadding($this->signaturePadding) : $privateKey->withPadding(RSA::SIGNATURE_PKCS1);
        } else {
            // 加密填充方式
            $privateKey = in_array($this->encryptPadding, $this->availableEncryptPadding) ?
                $privateKey->withPadding($this->encryptPadding) : $privateKey->withPadding(RSA::ENCRYPTION_PKCS1);
        }

        // HASH方式
        $privateKey = in_array($this->hash, $this->availableHash) ?
            $privateKey->withHash($this->hash) : $privateKey->withHash('sha256');
        // MGF HASH方式(只有padding为RSA::ENCRYPTION_OAEP可用)
        return in_array($this->mgfHash, $this->availableHash) ?
            $privateKey->withMGFHash($this->mgfHash) : $privateKey->withHash('sha256');
    }
}

```
:::

---

## 使用

> 参考：https://try8.cn/tool/cipher/rsa

---

### 生成秘钥对

:::: code-group
::: code-group-item 控制器
```php:no-line-numbers
/**
 * 创建RSA公私钥秘钥对.
 * @param EncryptRequest $request 请求验证器
 * @return array|MessageInterface|ResponseInterface 响应
 */
#[PostMapping(path: 'rsa/create')]
#[Scene(scene: 'rsa_create')]
public function createRsa(EncryptRequest $request): array|MessageInterface|ResponseInterface
{
    $keyFormat = $request->input('key_format'); // PKCS1 || PKCS8
    $keyLength = $request->input('key_length'); // 1024 || 2048 || 3072 || 4096
    $isDownload = $request->input('is_download', false);
    $certificatePassword = $request->input('certificate_password');

    $result = $this->service->createRSA($keyFormat, $keyLength, $certificatePassword, $isDownload);
    if (is_array($result)) {
        return $this->result->setData($result)->getResult();
    }

    return $result;
}
```
:::
::: code-group-item 逻辑
```php:no-line-numbers
/**
 * 获取RSA公私钥秘钥对.
 * @param string $keyFormat 秘钥格式
 * @param int $keyLen 密钥长度
 * @param null|string $certificatePassword 证书密码
 * @param bool $isDownload 是否下载公私钥
 * @return array|MessageInterface|ResponseInterface 响应
 */
public function createRSA(
    string $keyFormat,
    int $keyLen = 2048,
    string $certificatePassword = null,
    bool $isDownload = false,
): array|MessageInterface|ResponseInterface {
    $rsaInstance = new RsaWithPHPSeclib($certificatePassword, $keyLen, $keyFormat);
    if ($isDownload) {
        $certificateList = [
            BASE_PATH . '/runtime/openssl/private.pem',
            BASE_PATH . '/runtime/openssl/public.pem',
        ];
        $zipName = 'rsa-' . Carbon::now()->timestamp . '.zip';
        $zipPath = BASE_PATH . '/runtime/openssl/' . $zipName;
        Zip::compress($zipPath, $certificateList);

        $response = new Response();
        return $response->withHeader('content-description', 'File Transfer')
            ->withHeader('content-type', 'application/zip')
            ->withHeader('content-disposition', 'attachment; filename="' . $zipName . '"')
            ->withHeader('content-transfer-encoding', 'binary')
            ->withBody(new SwooleStream((string) file_get_contents($zipPath)));
    }
    return [
        'public_key' => $rsaInstance->getPublicKeyString(),
        'private_key' => $rsaInstance->getPrivateKeyString(),
    ];
}
```
:::
::::

---

### 公钥加密

:::: code-group
::: code-group-item 控制器
```php:no-line-numbers
/**
 * 公钥加密.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'rsa/public_key/encrypt')]
#[Scene(scene: 'encrypt_decrypt')]
public function publicKeyEncrypt(EncryptRequest $request): array
{
    [$key, $padding, $hash, $mgfHash, $data] = [
        $request->input('key'), // 公钥
        $request->input('padding'), // 加密填充方式
        $request->input('hash'), // 哈希算法
        $request->input('mgf_hash', ''), // mgf哈希算法 当加密填充模式为OAEP或签名填充模式为PSS使用
        $request->input('data'), // 待加密数据
    ];

    $encryptResult = $this->service->publicKeyEncrypt($key, $padding, $hash, $data, $mgfHash);
    return $this->result->setData(['encrypt_result' => $encryptResult])->getResult();
}
```
:::
::: code-group-item 逻辑
```php:no-line-numbers
/**
 * 公钥加密.
 * @param string $key 公钥
 * @param string $encryptPadding 加解密填充方式
 * @param string $hash 单向哈希
 * @param array|string $data 待加密数据
 * @param string $mgfHash 当加密填充模式为OAEP或签名填充模式为PSS使用
 * @return string 加密结果
 */
public function publicKeyEncrypt(
    string $key,
    string $encryptPadding,
    string $hash,
    string|array $data,
    string $mgfHash = 'sha256',
): string {
    /** @var PublicKey|RSA $publicKey */
    $publicKey = RSA::loadPublicKey($key);
    // 是否需要mgfHash
    if ($encryptPadding === 'ENCRYPTION_OAEP') {
        $publicKey = $publicKey->withHash($hash)->withMGFHash($mgfHash);
    } else {
        $publicKey = $publicKey->withHash($hash);
    }
    $encryptPadding = match ($encryptPadding) {
        'ENCRYPTION_OAEP' => RSA::ENCRYPTION_OAEP,
        'ENCRYPTION_PKCS1' => RSA::ENCRYPTION_PKCS1,
        default => RSA::ENCRYPTION_NONE,
    };
    $publicKey = $publicKey->withPadding($encryptPadding);
    $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $data;
    return base64_encode($publicKey->encrypt($data));
}
```
:::
::::

---

### 私钥解密

:::: code-group
::: code-group-item 控制器
```php:no-line-numbers
/**
 * 私钥解密.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'rsa/private_key/decrypt')]
#[Scene(scene: 'encrypt_decrypt')]
public function privateKeyDecrypt(EncryptRequest $request): array
{
    [$key, $padding, $hash, $mgfHash, $data, $password] = [
        $request->input('key'), // 私钥
        $request->input('padding'), // 加密填充方式
        $request->input('hash'), // 哈希算法
        $request->input('mgf_hash', ''), // mgf哈希算法 当加密填充模式为OAEP或签名填充模式为PSS使用
        $request->input('data'), // 待解密数据
        $request->input('password', ''), // 证书密码
    ];

    $decryptResult = $this->service->privateKeyDecrypt($key, $padding, $hash, $data, $mgfHash, $password);
    return $this->result->setData(['decrypt_result' => $decryptResult])->getResult();
}
```
:::
::: code-group-item 逻辑
```php:no-line-numbers
/**
 * 私钥解密.
 * @param string $key 私钥
 * @param string $encryptPadding 加解密填充方式
 * @param string $hash 单向哈希
 * @param array|string $data 待加密数据
 * @param string $mgfHash 当加密填充模式为OAEP或签名填充模式为PSS使用
 * @param string $password 证书密码
 * @return mixed 解密结果
 */
public function privateKeyDecrypt(
    string $key,
    string $encryptPadding,
    string $hash,
    string|array $data,
    string $mgfHash = 'sha256',
    string $password = '',
): mixed {
    /** @var PrivateKey|RSA $privateKey */
    $privateKey = RSA::loadPrivateKey($key, $password);
    // 是否需要mgfHash
    if ($encryptPadding === 'ENCRYPTION_OAEP') {
        $privateKey = $privateKey->withHash($hash)->withMGFHash($mgfHash);
    } else {
        $privateKey = $privateKey->withHash($hash);
    }
    $encryptPadding = match ($encryptPadding) {
        'ENCRYPTION_OAEP' => RSA::ENCRYPTION_OAEP,
        'ENCRYPTION_PKCS1' => RSA::ENCRYPTION_PKCS1,
        default => RSA::ENCRYPTION_NONE,
    };
    $privateKey = $privateKey->withPadding($encryptPadding);
    $decrypt = $privateKey->decrypt(base64_decode($data));
    return json_decode($decrypt, true) ?? $decrypt;
}
```
:::
::::

---

### 私钥加签

:::: code-group
::: code-group-item 控制器
```php:no-line-numbers
/**
 * 私钥加签.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'rsa/private_key/sign')]
#[Scene(scene: 'sign')]
public function privateKeySign(EncryptRequest $request): array
{
    [$key, $padding, $hash, $mgfHash, $data, $password] = [
        $request->input('key'), // 私钥
        $request->input('padding'), // 加密填充方式
        $request->input('hash'), // 哈希算法
        $request->input('mgf_hash', ''), // mgf哈希算法 当加密填充模式为OAEP或签名填充模式为PSS使用
        $request->input('data'), // 待解密数据
        $request->input('password', ''), // 证书密码
    ];

    $sign = $this->service->privateKeySign($key, $padding, $hash, $data, $mgfHash, $password);
    return $this->result->setData(['sign' => $sign])->getResult();
}
```
:::
::: code-group-item 逻辑
```php:no-line-numbers
/**
 * 私钥签名.
 * @param string $key 私钥
 * @param string $signPadding 签名填充方式
 * @param string $hash 单向哈希
 * @param array|string $data 待签名数据
 * @param string $mgfHash 当加密填充模式为OAEP或签名填充模式为PSS使用
 * @param string $password 证书密码
 * @return string 签名
 */
public function privateKeySign(
    string $key,
    string $signPadding,
    string $hash,
    string|array $data,
    string $mgfHash = 'sha256',
    string $password = '',
): string {
    /** @var PrivateKey|RSA $privateKey */
    $privateKey = RSA::loadPrivateKey($key, $password);
    //        RSA::SIGNATURE_PKCS1, RSA::SIGNATURE_PSS
    // 是否需要mgfHash
    if ($signPadding === 'SIGNATURE_PSS') {
        $privateKey = $privateKey->withHash($hash)->withMGFHash($mgfHash);
    } else {
        $privateKey = $privateKey->withHash($hash);
    }
    $signPadding = match ($signPadding) {
        'SIGNATURE_PKCS1' => RSA::SIGNATURE_PKCS1,
        'SIGNATURE_PSS' => RSA::SIGNATURE_PSS,
    };
    $privateKey = $privateKey->withPadding($signPadding);
    $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $data;
    return base64_encode($privateKey->sign($data));
}
```
:::
::::

---

### 公钥验签

:::: code-group
::: code-group-item 控制器
```php:no-line-numbers
/**
 * 公钥验签.
 * @param EncryptRequest $request 请求验证器
 * @return array ['code' => '200', 'msg' => 'ok', 'status' => true, 'data' => []]
 */
#[PostMapping(path: 'rsa/public_key/verify')]
#[Scene(scene: 'sign')]
public function publicKeyVerifySign(EncryptRequest $request): array
{
    [$key, $padding, $hash, $mgfHash, $data, $sign] = [
        $request->input('key'), // 公钥
        $request->input('padding'), // 签名填充方式
        $request->input('hash'), // 哈希算法
        $request->input('mgf_hash', ''), // mgf哈希算法 当加密填充模式为OAEP或签名填充模式为PSS使用
        $request->input('data'), // 加签源数据
        $request->input('sign', ''), // 签名
    ];

    $verifyResult = $this->service->publicKeyVerifySign($key, $padding, $hash, $data, $sign, $mgfHash);
    return $this->result->setData(['verify_sign_result' => $verifyResult])->getResult();
}
```
:::
::: code-group-item 逻辑
```php:no-line-numbers
/**
 * 公钥验签.
 * @param string $key 公钥
 * @param string $signPadding 签名填充方式
 * @param string $hash 单向哈希
 * @param array|string $data 加签的原数据
 * @param string $sign 签名
 * @param string $mgfHash 当加密填充模式为OAEP或签名填充模式为PSS使用
 * @return bool 验签结果
 */
public function publicKeyVerifySign(
    string $key,
    string $signPadding,
    string $hash,
    string|array $data,
    string $sign,
    string $mgfHash = 'sha256',
): bool {
    /** @var PublicKey|RSA $publicKey */
    $publicKey = RSA::loadPublicKey($key);
    // 是否需要mgfHash
    if ($signPadding === 'SIGNATURE_PSS') {
        $publicKey = $publicKey->withHash($hash)->withMGFHash($mgfHash);
    } else {
        $publicKey = $publicKey->withHash($hash);
    }
    $signPadding = match ($signPadding) {
        'SIGNATURE_PKCS1' => RSA::SIGNATURE_PKCS1,
        'SIGNATURE_PSS' => RSA::SIGNATURE_PSS,
    };
    $publicKey = $publicKey->withPadding($signPadding);
    $data = is_array($data) ? json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : $data;
    return $publicKey->verify($data, base64_decode($sign));
}
```
:::
::::