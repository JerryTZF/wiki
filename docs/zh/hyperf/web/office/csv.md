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

prev: /zh/hyperf/web/office/excel
next: /zh/hyperf/web/convert/aes
sidebarDepth: 3
---

# 数据导出Csv

目录

[[toc]]

## 封装工具类

::: details 查看代码
```php:no-line-numbers
<?php

declare(strict_types=1);
namespace App\Lib\Office;

use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\HttpServer\Response;
use Psr\Http\Message\ResponseInterface;

class ExportCsvHandler
{
    /**
     * csv字符串.
     */
    private string $content = '';

    /**
     * 保存路径.
     */
    private string $dir;

    public function __construct()
    {
        $this->dir = BASE_PATH . '/runtime/csv/';
        if (! is_dir($this->dir)) {
            mkdir($this->dir, 0777, true);
        }
    }

    /**
     * 设置表头.
     * @example ['汽车品牌', '型号', '颜色', '价格', '经销商']
     * @return $this
     */
    public function setHeaders(array $headers): static
    {
        $this->content .= mb_convert_encoding(implode(',', $headers), 'GBK', 'UTF-8') . "\n";
        return $this;
    }

    /**
     * 添加数据.
     * @return $this
     */
    public function setData(array $data): static
    {
        if (! empty($this->content)) {
            foreach ($data as $value) {
                $this->content .= mb_convert_encoding(implode(',', array_values($value)), 'GBK', 'UTF-8') . "\n";
            }
        }
        return $this;
    }

    /**
     * 保存CSV到本地.
     */
    public function saveToLocal(string $filename): string
    {
        $filename = $filename . '.csv';
        $outFileName = $this->dir . $filename;
        file_put_contents($outFileName, $this->content);

        return $outFileName;
    }

    /**
     * 输出到浏览器.
     */
    public function saveToBrowser(string $filename): ResponseInterface
    {
        $filename = $filename . '.csv';
        $response = new Response();
        return $response->withHeader('content-description', 'File Transfer')
            ->withHeader('content-type', 'text/csv')
            ->withHeader('content-disposition', "attachment; filename={$filename}")
            ->withHeader('content-transfer-encoding', 'binary')
            ->withHeader('pragma', 'public')
            ->withBody(new SwooleStream($this->content));
    }
}

```
:::

---

## 使用

```php:no-line-numbers
#[GetMapping(path: 'office/csv/download')]
public function downloadCsv()
{
    $lock = new RedisLock('export_csv', 3, 3, 'downloadCsv');
    return $lock->lockAsync(function () {
        $csvHandler = new ExportCsvHandler();
        $csvHandler->setHeaders([
            'ID', '商品ID', '订单号', '购买数量', '金额', '客户', '创建时间', '修改时间',
        ]);
        Orders::query()->orderBy('id', 'DESC')
            ->chunk(20, function ($records) use ($csvHandler) {
                $csvHandler->setData($records->toArray());
            });
        return $csvHandler->saveToBrowser('CSV测试导出');
    });
}

#[GetMapping(path: 'office/csv/save')]
public function saveCsv(): array
{
    $lock = new RedisLock('save_csv', 3, 3, 'saveCsv');
    $file = $lock->lockAsync(function () {
        $csvHandler = new ExportCsvHandler();
        $csvHandler->setHeaders([
            'ID', '商品ID', '订单号', '购买数量', '金额', '客户', '创建时间', '修改时间',
        ]);
        Orders::query()->orderBy('id', 'DESC')
            ->chunk(20, function ($records) use ($csvHandler) {
                $csvHandler->setData($records->toArray());
            });
        return $csvHandler->saveToLocal('Csv测试导出');
    });
    return $this->result->setData(['file_path' => $file])->getResult();
}
```