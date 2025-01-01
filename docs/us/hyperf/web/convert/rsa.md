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

prev: /us/hyperf/web/convert/aes
next: /us/hyperf/web/convert/aws4
sidebarDepth: 3
---

# RSA

Index

[[toc]]

## Core Concepts

***1、Symmetric Encryption***

> Both parties involved in communication hold the same `key` and use an `algorithm` to encrypt and decrypt the data being transmitted.
> Common algorithms include `AES`, `DES`, `RC4`, etc.
---
***2、Asymmetric Encryption***
> In asymmetric encryption, both the sender and the receiver have two separate keys: `a private key` and
> `a public key`. The `private key` is held by the data sender, while the `public key` can be made public. 
> Common algorithms include `RSA`.
---
***3、RSA Algorithm Rules***
> - Data encrypted with the private key can only be decrypted with the corresponding public key, and data encrypted with the public key can only be decrypted with the corresponding private key.
> - The private key can generate the public key, but the public key cannot generate the private key.
> - **<font color="red">Data encrypted with the ***public key*** is decrypted with the ***private key***, which is called `encryption and decryption`; Data encrypted with the private key is decrypted with the public key, which is called `signing and verification`</font>**
 
---
***4、Hash Digest***
> A one-way `Hash` function is applied to a piece of data to generate a fixed-length Hash value, which is the digest or fingerprint of that data.
If the data is modified in any way, the resulting `Hash` value will be inconsistent.
---
***5、Digital Signature***
> Used to ensure data integrity and authenticate the data source. This ensures that the data cannot be tampered with and prevents others from impersonating the sender during data transmission.
The private key in `RSA` signing guarantees that the data cannot be impersonated.
---
***6、Digital Certificate***

> Digital signatures are mainly used to verify data integrity and authenticate the data source, while digital certificates are primarily used to securely distribute public keys. A digital certificate generally consists of three parts: the user's information, the user's public key, and the CA's signature on the certificate entity information.

## Communication Process

***Assume that A and B want to communicate securely:***

> 1、`A` generates a key pair: `privateKeyA` and `publicKeyA`; `B` generates a key pair: `privateKeyB` and `publicKeyB`. \
> 2、`A` sends `publicKeyA` to `B`, and `B` sends `publicKeyB` to `A`. At this point, `A` has `privateKeyA` and `publicKeyB`, and `B` has `privateKeyB` and `publicKeyA` \
> 3、`A` performs a hash calculation on `PlaintextA`, obtaining `DigestA` (to prevent data tampering). Then, `A` uses `privateKeyA` to sign `DigestA`, resulting in `SignA` (to ensure the data is sent by `A`). At the same time, `A` uses `privateKeyA` to encrypt `PlaintextA`, obtaining `CiphertextA`. A then sends `CiphertextA` and SignA to `B`. \
> 4、`B` receives `CiphertextA` and `SignA`, then uses `publicKeyA` to decrypt `CiphertextA` and obtain `PlaintextA`. `B` performs a hash calculation on `PlaintextA` to get `DigestB`. Simultaneously, `B` uses `publicKeyA` to decrypt `SignA` and obtain `DigestA`, then compares `DigestA` and `DigestB` to check if they are the same.
> At the same time, `B` uses `publicKeyA` to decrypt `SignA` and obtain `DigestA`, then compares `DigestA` and `DigestB` to check if they are the same.

---

::: tip 【Flowchart】
![](https://img.tzf-foryou.xyz/img/20230825154528.png)
:::

## Encapsulation of Utility Class

::: details Detail
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

## Usage

> See：https://try8.cn/tool/cipher/rsa

---

### Generate Key Pair

::: tabs
@tab Controller
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
@tab Logic
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

---

### Public Key Encryption

::: tabs
@tab Controller
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
@tab Logic
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

---

### Private Key Decryption

::: tabs
@tab Controller
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
@tab Logic
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

---

### Private Key Signing

::: tabs
@tab Controller
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
@tab Logic
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

---

### Public Key Verification

::: tabs
@tab Controller
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
@tab Logic
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
