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

## 使用

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