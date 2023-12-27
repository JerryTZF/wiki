---
sidebar: false
sidebarDepth: 3

---

# 规范相关

目录
[[TOC]]

## 响应规范

作为 `Http Server` 使用时，我们应当使得所有的响应均为标准的 `json` 格式，无论业务异常，还是server自身异常。除非服务已经挂了，无法请求。

我们的响应状态码业务层面无论是否符合业务逻辑，均应该返回 `200`，路由未找到应返回 `404`，请求方法错误应返回 `405`。语法错误或者代码错误，我们 应该返回 `500`状态码。

:::: code-group
::: code-group-item 成功示例
```json:no-line-numbers
// http code: 200
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": []
}
```
:::

::: code-group-item 失败示例
```json:no-line-numbers
// http code: 200
{
    "code": 9711,
    "msg": "当前用户不存在",
    "status": false,
    "data": []
}
```
:::

::: code-group-item 路由未找到
```json:no-line-numbers
// http code: 404
{
    "code": 9902,
    "msg": "API地址错误或HTTP方法错误，请检查 :(",
    "status": false,
    "data": []
}
```
:::
::: code-group-item 错误请求方法
```json:no-line-numbers
// http code: 405
{
    "code": 9903,
    "msg": "HTTP方法错误，请检查 :(",
    "status": false,
    "data": []
}
```
:::
::: code-group-item 服务异常
```json:no-line-numbers
// http code: 500
{
    "code": 9999,
    "msg": "系统繁忙，请稍后尝试",
    "status": false,
    "data": []
}
```
:::

::: code-group-item 表单验证不通过
```json:no-line-numbers
// http code: 422
{
    "code": 9906,
    "msg": "数据验证失败，原因如下：gid 商品id必须为整数",
    "status": false,
    "data": []
}
```
:::
::::


## 日志规范

1. 格式规范，我们应该保持所有的日志格式是统一风格。例如：\
`[YYYY-MM-DD HH:II:SS][${class}@${method}][${level}][${message}][${trace_info}]`
2. 分割规范，日志应该按照日志等级用不同的文件进行保存，这样更容易分辨日志类型。且日志文件名称使用日期进行区分保存。
3. 要区分 `CLI`日志和 `DISK` 日志，因为是CLI模式运行，那么会存在终端日志输出和磁盘日志。
4. 线上业务中应该尽可能的只保存异常日志。

## 自定义封装类库规范

::: tip 自定义封装lib库
[示例](https://github.com/JerryTZF/hyperf-v3/tree/main/app/Lib)
:::

1. 尽可能在三方包的基础上再次进行封装，即：`packigst -> lib -> service`
2. 自定义类库不允许和任务业务类型相关联，必须是聚合功能的无业务的功能。
3. 一些功能函数性质的功能，应该封装一个类中，尽可能不使用函数，统一调用。
4. 公共库或者功能，如果在业务中使用频率非常非常低(例如全局只有一个地方调用)，那么应该思考它是否值得单独拎出来。
5. 自定义类库的异常应该全部捕获而不往外抛出，且做日志处理。

## 配置规范

1. 框架底层中会提供一些能力的类需要配置在 `config\autoload` 目录下，我们应当遵循：如果不重写(overload)，那么应该配置原生类，否则我们应当使用注解来使得配置生效。
2. 当服务运行中，需要更改某些配置生效时，我们应该在外部维护一些配置，例如控制是否投递继续投递队列，是否继续执行定时任务等。

---

***举例说明***

```php:no-line-numbers
<?php

declare(strict_types=1);

// 当我们不自定义任务调度器时，将底层调度器注册至此即可，如果我们需要自定义
// 该调度器，我倾向于使用注解使其生效，而非自定义调度器注册于此。个人习惯。
return [
    // 定时任务调度器进程
    Hyperf\Crontab\Process\CrontabDispatcherProcess::class,
];

```

## 异常规范

1. 所有的 `http` 中的异常我们均需要封装对应的异常捕获器来捕获，且三方包中的异常我们也需要进行进行封装和处理。(别忘记注册异常处理器)
2. 建议自定义进程(定时任务执行器、异步队列消费进程等)中的异常均使用 `try-catch-finally` 处理。

## 其他

TODO

::: warning ￣□￣｜｜ 持续施工
:construction: 规划中。。。
:::