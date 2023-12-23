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

prev: /zh/hyperf/web/lock/queue
next: /zh/hyperf/web/office/csv
sidebarDepth: 3
---

# 数据导出Excel

目录

[[toc]]

---

## 安装依赖包

> [标准库地址](https://packagist.org/packages/phpoffice/phpspreadsheet)

 ```shell:no-line-numbers
composer require phpoffice/phpspreadsheet
```

---

## 封装工具类

::: details 查看代码
```php:no-line-numbers
<?php

namespace App\Lib\Office;

use Hyperf\HttpMessage\Stream\SwooleStream;
use Hyperf\HttpServer\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Exception;
use Psr\Http\Message\ResponseInterface;

class ExportExcelHandler
{
    /**
     * 表格制作实例.
     * @var Spreadsheet 实例
     */
    private Spreadsheet $spreadsheet;

    /**
     * 表格实例.
     * @var Worksheet 实例
     */
    private Worksheet $sheet;

    /**
     * 行数.
     * @var int 整型
     */
    private int $row;

    /**
     * 保存路径.
     * @var string 路径
     */
    private string $dir;

    public function __construct()
    {
        $this->spreadsheet = new Spreadsheet();
        $this->spreadsheet->getProperties()
            ->setCreator('Hyperf')
            ->setLastModifiedBy('Hyperf')
            ->setTitle('ExportExcelHandler 2007 XLSX Test Document')
            ->setSubject('ExportExcelHandler 2007 XLSX Test Document')
            ->setDescription('Test document for ExportExcelHandler 2007 XLSX, generated using PHP classes.')
            ->setKeywords('')
            ->setCategory('Excel');
        // Sets the active sheet index to the first sheet
        $this->spreadsheet->setActiveSheetIndex(0);
        // Active sheet
        $this->sheet = $this->spreadsheet->getActiveSheet();
        // Set name
        $this->spreadsheet->getActiveSheet()->setTitle('Sheet1');

        $this->dir = BASE_PATH . '/runtime/excel/';
        if (! is_dir($this->dir)) {
            mkdir($this->dir, 0755, true);
        }
    }

    /**
     * 设置表头.
     * @return $this
     * @example ['汽车品牌', '型号', '颜色', '价格', '经销商']
     */
    public function setHeaders(array $title): static
    {
        foreach ($title as $k => $item) {
            $this->sheet->setCellValue(chr($k + 65) . '1', $item);
        }
        $this->row = 2;
        return $this;
    }

    /**
     * 添加数据.
     * @return $this
     * @example [['宝马','X5','BLACK','54.12W','深圳宝马4S店'],[],[]]
     */
    public function setData(array $data): static
    {
        foreach ($data as $datum) {
            $col = 'A';
            foreach ($datum as $value) {
                // write col
                $this->sheet->setCellValue($col . $this->row, $value);
                ++$col;
            }
            ++$this->row;
        }
        return $this;
    }

    /**
     * 保存到本地.
     * @throws Exception
     * @throws \PhpOffice\PhpSpreadsheet\Exception
     */
    public function saveToLocal(string $filename): string
    {
        $this->spreadsheet->setActiveSheetIndex(0);

        $filename .= '.xlsx';
        $filename = mb_convert_encoding($filename, 'UTF-8', 'auto');
        $outFileName = $this->dir . $filename;
        $writer = IOFactory::createWriter($this->spreadsheet, 'Xlsx');
        $writer->save($outFileName);

        $this->spreadsheet->disconnectWorksheets();
        unset($this->spreadsheet);

        return $outFileName;
    }

    /**
     * 输出到浏览器.
     * @throws Exception
     */
    public function saveToBrowser(string $filename): ResponseInterface
    {
        $filename .= '.xlsx';
        $filename = mb_convert_encoding($filename, 'UTF-8', 'auto');
        $unique = $this->dir . uniqid() . microtime() . '.xlsx';
        $writer = IOFactory::createWriter($this->spreadsheet, 'Xlsx');
        $writer->save($unique);

        $this->spreadsheet->disconnectWorksheets();
        unset($this->spreadsheet);

        $content = file_get_contents($unique);
        // 删除临时文件
        unlink($unique);

        $response = new Response();

        return $response->withHeader('content-description', 'File Transfer')
            ->withHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->withHeader('content-disposition', 'attachment; filename="' . urlencode($filename) . '"')
            ->withHeader('content-transfer-encoding', 'binary')
            ->withBody(new SwooleStream((string) $content));
    }
}

```
:::

## 异常封装和注册

> 封装异常捕获

::: details
```php:no-line-numbers
<?php

namespace App\Exception\Handler;

use App\Constants\SystemCode;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use PhpOffice\PhpSpreadsheet\Exception;
use Psr\Http\Message\ResponseInterface;
use Throwable;

/**
 * phpoffice包异常处理器.
 * Class OfficeExceptionHandler.
 */
class OfficeExceptionHandler extends ExceptionHandler
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
                'code' => SystemCode::OFFICE_ERR,
                'msg' => SystemCode::getMessage(SystemCode::OFFICE_ERR),
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
        return $throwable instanceof Exception;
    }
}

```
:::

---

> 注册异常

```php:no-line-numbers
<?php

declare(strict_types=1);
return [
    'handler' => [
        'http' => [
            ...
            // phpoffice 包异常捕获
            App\Exception\Handler\OfficeExceptionHandler::class,
            ...
        ],
    ],
];

``` 

## 使用

```php:no-line-numbers
/**
 * 导出订单Excel(同步).
 * @return MessageInterface|ResponseInterface 文件流
 * @throws ContainerExceptionInterface 异常
 * @throws LockTimeoutException 异常
 * @throws NotFoundExceptionInterface 异常
 */
#[GetMapping(path: 'export/excel')]
public function exportOrderExcel(): MessageInterface|ResponseInterface
{
    // 使用锁防止并发导出消耗大量内存.
    $lock = new RedisLock('exportExcel', 5, 3, 'exportOrderExcel');
    return $lock->lockAsync(function () {
        $excelHandler = new ExportExcelHandler();
        // 设置表头
        $excelHandler->setHeaders([
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
            ->chunk(20, function ($records) use ($excelHandler) {
                $excelHandler->setData($records->toArray());
            });
        return $excelHandler->saveToBrowser('订单列表导出');
    });
}
```