---
sidebar: false
sidebarDepth: 3

---

# Specification Guidelines

Index
[[TOC]]

## Response Specification

When using as an `Http Server`, all responses should be in a standard `json` format, whether it is a business exception or a server-side exception. Unless the service is down and cannot process requests.

Our response status codes should always return `200` for business logic, 
regardless of whether it matches the business logic. 
If a route is not found, return `404`; if the request method is incorrect, return `405`.
For syntax errors or code errors, we should return a `500` status code.

::: tabs
@tab success
```json:no-line-numbers
// http code: 200
{
    "code": 200,
    "msg": "ok",
    "status": true,
    "data": []
}
```
@tab fail
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

---

::: tabs
@tab Route not found.
```json:no-line-numbers
// http code: 404
{
    "code": 9902,
    "msg": "API地址错误或HTTP方法错误，请检查 :(",
    "status": false,
    "data": []
}
```
@tab Incorrect request method.
```json:no-line-numbers
// http code: 405
{
    "code": 9903,
    "msg": "HTTP方法错误，请检查 :(",
    "status": false,
    "data": []
}
```
@tab Service exception.
```json:no-line-numbers
// http code: 500
{
    "code": 9999,
    "msg": "系统繁忙，请稍后尝试",
    "status": false,
    "data": []
}
```
@tab Form validation failed.
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

## Log Specification

1. **`Format Specification`**: We should maintain a consistent format for all logs. For example: \
`[YYYY-MM-DD HH:II:SS][${class}@${method}][${level}][${message}][${trace_info}]`
2. **`Segmentation Specification`**: Logs should be saved in different files based on the log level, making it easier to distinguish between log types. The log file names should be differentiated by the date.
3. **`CLI`** and **`DISK`** Logs: It's important to distinguish between CLI logs and DISK logs. Since the system operates in CLI mode, there will be both terminal log outputs and disk logs.
4. **`Production Logs`**: In production environments, only exception logs should be saved as much as possible.

---

## Custom Wrapper Library Specification


::: tip Custom Lib
[Example](https://github.com/JerryTZF/hyperf-v3/tree/main/app/Lib)
:::


1. `Encapsulation on top of third-party packages`: Whenever possible, encapsulate on top of third-party packages, i.e., `package -> lib -> service`.
2. `Separation of concerns`: Custom libraries should not be associated with task business types. They must focus on aggregating functionalities that are business-agnostic.
3. `Functional encapsulation`: Functions that serve as utility functions should be encapsulated into classes, and functions should be avoided where possible. Ensure that they are uniformly invoked.
4. `Common libraries or features`: If a library or feature is used very infrequently in the business (for example, only called in one place globally), it should be reconsidered whether it is worth extracting as a separate library.
5. `Exception handling in custom libraries`: All exceptions in custom libraries should be caught internally and not thrown externally, and proper logging should be performed.



## Configuration Specification

1. The underlying framework provides some capability classes that need to be configured under the `config\autoload` directory. We should follow this rule: If the class is not being overridden (overloaded), it should be configured with the native class; otherwise, we should use annotations to make the configuration effective.
2. When certain configurations need to take effect during service operation, we should maintain some external configurations, such as controlling whether to continue dispatching to queues or whether to continue executing scheduled tasks.

---

***Code Example***

```php:no-line-numbers
<?php

declare(strict_types=1);

// When we do not customize the task scheduler, simply register the underlying scheduler here. If we need to customize
// the scheduler, I prefer using annotations to make it effective, rather than custom scheduler registration here. This is my personal habit.

return [
    // Scheduled task scheduler process
    Hyperf\Crontab\Process\CrontabDispatcherProcess::class,
];

```

## Exception Specification

1. All exceptions in http should be encapsulated by corresponding exception handlers for capturing, and exceptions from third-party packages should also be encapsulated and handled. (Don’t forget to register the exception handlers.)
2. It is recommended to use `try-catch-finally` to handle exceptions in custom processes (such as scheduled task executors, asynchronous queue consumer processes, etc.).

## Others

TODO

::: warning ￣□￣｜｜ Under construction
:construction: Planning in progress...
:::