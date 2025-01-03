---
sidebar: false
sidebarDepth: 3

---

# Usage Tips

Index
[[TOC]]

## About Service Restart

`Hyperf` itself is based on the lifecycle of `Swoole`. For `Custom Processes`, `Worker Processes`, etc., it runs in CLI mode. When the service restarts, if there are tasks (HTTP requests, asynchronous tasks, scheduled tasks, etc.) being processed, unpredictable issues may arise.

Although the framework provides a `Signal Handler`, it is still not recommended to rely entirely on this component for blind restarts. Here are two solutions regarding service restarts:

1. Use `K8S`, `Docker Swarm`, etc., for rolling restarts or switch traffic at the gateway.
2. For tasks like queues and scheduled tasks, it is better to define an external variable that controls whether the message or task should be executed.

## Swoole and PHP-FPM

Before understanding coroutines, let's first understand the traditional `PHP-FPM` working mode. `PHP-FPM` is essentially a process manager that implements the `FastCGI` protocol.
When a request is sent to `Nginx` or `Apache`, `Nginx` forwards the request to `PHP-FPM` via the `FastCGI` protocol, and PHP-FPM forks the corresponding `worker` process to execute the PHP `script`. 
After execution, the process is recycled. The entire process is `synchronous` and `blocking`.
When there are a large number of concurrent requests, a significant number of processes are created, and the creation and destruction of these processes are resource-intensive. 
Additionally, under multi-process, a large number of `MySQL` connections will be generated, leading to database bottlenecks.

---


To address the pain points of traditional FPM, one might think of using multiple threads within a single process to handle multiple requests or concurrency issues. 
However, from a code perspective, PHP is not friendly with threads. 
Moreover, multi-threading introduces additional problems, such as lock contention (CPU scheduling), 
lock granularity, deadlocks, and thread exceptions that could cause the entire process to crash. 
In such cases, `Coroutines` can be used to solve the problem.

## Service Usage Categories

When using `Hyperf` as a pure `Http Server`, we should ideally use a `gateway` (e.g., Gateway) or reverse proxies like `Nginx` to manage traffic. 
Although `Hyperf` can be used directly as an `Http Server`. (╬￣皿￣)=○

When using it as an asynchronous task processing service, special attention should be given to service restart issues.

---

::: warning ￣□￣｜｜
Under construction :construction: \
Planning in progress...
:::