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

prev: /us/hyperf/web/office/excel
next: /us/hyperf/web/convert/aes
sidebarDepth: 3
---

# Data Export to CSV

Index

[[toc]]

## Utility Class Encapsulation

::: details Detail
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
     * @var string 内容字符串
     */
    private string $content = '';

    /**
     * 保存路径.
     * @var string 路径
     */
    private string $dir;

    public function __construct()
    {
        $this->dir = BASE_PATH . '/runtime/csv/';
        if (! is_dir($this->dir)) {
            mkdir($this->dir, 0755, true);
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
     * @param string $filename 文件名
     * @return string 文件
     */
    public function saveToLocal(string $filename): string
    {
        $filename .= '.csv';
        $filename = mb_convert_encoding($filename, 'UTF-8', 'auto');
        $outFileName = $this->dir . $filename;
        file_put_contents($outFileName, $this->content);

        return $outFileName;
    }

    /**
     * 输出到浏览器.
     * @param string $filename 文件名
     * @return ResponseInterface 文件流
     */
    public function saveToBrowser(string $filename): ResponseInterface
    {
        $filename .= '.csv';
        $filename = mb_convert_encoding($filename, 'UTF-8', 'auto');
        $response = new Response();
        return $response->withHeader('content-description', 'File Transfer')
            ->withHeader('content-type', 'text/csv')
            ->withHeader('content-disposition', 'attachment; filename="' . urlencode($filename) . '"')
            ->withHeader('content-transfer-encoding', 'binary')
            ->withHeader('pragma', 'public')
            ->withBody(new SwooleStream($this->content));
    }
}

```
:::

---

## Usage

```php:no-line-numbers
/**
 * 导出订单Csv(同步).
 * @return MessageInterface|ResponseInterface 文件流
 * @throws ContainerExceptionInterface 异常
 * @throws LockTimeoutException 异常
 * @throws NotFoundExceptionInterface 异常
 */
#[GetMapping(path: 'export/csv')]
public function exportOrderCsv(): MessageInterface|ResponseInterface
{
    // 使用锁防止并发导出消耗大量内存.
    $lock = new RedisLock('exportCsv', 5, 3, 'exportOrderCsv');
    return $lock->lockAsync(function () {
        $csvHandler = new ExportCsvHandler();
        // 设置表头
        $csvHandler->setHeaders([
            '序号', '商品ID', '商品名称', '订单编号', '购买数量', '支付金额', '买家昵称', '创建订单时间',
        ]);
        // 分块设置数据
        $fields = [
            'orders.id', 'orders.gid', 'goods.name', 'orders.order_no', 'orders.number', 'orders.payment_money',
            'users.account', 'orders.create_time',
        ];
        Orders::query()
            ->leftJoin('users', 'users.id', '=', 'orders.uid')
            ->leftJoin('goods', 'goods.id', '=', 'orders.gid')
            ->where('orders.number', '>', 1)
            ->select($fields)
            ->chunk(20, function ($records) use ($csvHandler) {
                $csvHandler->setData($records->toArray());
            });
        return $csvHandler->saveToBrowser('订单列表导出');
    });
}
```