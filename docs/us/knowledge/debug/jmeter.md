---
sidebar: [
{text: '🚩 Version Control (Git)', collapsible: true, children: [
{text: 'Key Configuration and Usage', 'link': 'knowledge/git/keys'},
{text: 'Multi-platform and Multi-repository Key Management', 'link': 'knowledge/git/multiple'},
{text: 'Collaborative Development', 'link': 'knowledge/git/cooperation'},
{text: 'Common Scenarios and Solutions', 'link': 'knowledge/git/qa'},
{text: 'Others', 'link': 'knowledge/git/others'},
]},
{text: '✏️ Editor (Idea)', collapsible: true, children: [
{text: 'Shortcut Key Modification', 'link': 'knowledge/idea/keymap'},
{text: 'VCS Operations', 'link': 'knowledge/idea/vcs'},
{text: 'Others', 'link': 'knowledge/idea/theme'},
]},
{text: '🎁 Debugging Tools', collapsible: true, children: [
{text: 'Stress Testing Tools', 'link': 'knowledge/debug/jmeter'},
{text: 'API Testing', 'link': 'knowledge/debug/postman'},
{text: 'Packet Sniffing Tools', 'link': 'knowledge/debug/charles'},
]},
{text: '🔭 Client', collapsible: true, children: [
{text: 'Navicat', 'link': 'knowledge/client/navicat'},
{text: 'Mredis', 'link': 'knowledge/client/mredis'},
{text: 'Docker Desktop', 'link': 'knowledge/client/docker'},
]},
{text: '🍎 Mac Tools', collapsible: true, children: [
{text: 'Brew', 'link': 'knowledge/mac/brew'},
{text: 'Iterm2', 'link': 'knowledge/mac/iterm2'},
]},
{text: '🌈 Miscellaneous', collapsible: true, children: [
{text: 'List', 'link': 'knowledge/sundry/picgo'},
]}
]

prev: /us/knowledge/idea/theme
next: /us/knowledge/debug/postman
---

# Stress Testing Tools

Index
[[toc]]

## AB

> `ab` is short for Apache Bench, a command-line tool that creates multiple concurrent threads to simulate multiple users accessing an HTTP URL simultaneously.

### Common Parameters

```text:no-line-numbers
-n Specifies the total number of requests to perform during the test. By default, only one request is executed. If the -t parameter is not specified, the test will automatically end after completing all the requests.
-c Specifies the number of concurrent requests to make, i.e., how many requests are sent at the same time. The default is one request at a time. This parameter controls the concurrency rate of requests to the server within a given time frame.
-t Specifies the maximum duration of the test in seconds. By default, there is no time limit. Its implicit value is [-n 50000]. This option restricts the test to a fixed total time, and if the time expires before all requests are completed, the test will stop.
-p Specifies a file containing data to be sent via POST. The data format should match the interface request parameters, e.g., xxx.json.
-T Specifies the Content-type header used for POST data, to define the request data format, e.g., application/json.
-r By default, the test stops if a request fails. Adding this parameter allows the test to continue even if some requests fail.
-C Adds a cookie to the request, typically in the format name=value. This parameter can be used multiple times.
-H Adds additional headers to the request. This is typically in the format of a valid header line, such as "Accept-Encoding: zip/zop;8bit".
-X Uses a proxy server for the request.
-k Enables HTTP KeepAlive (persistent connection) so that multiple requests are executed within a single HTTP session. By default, KeepAlive is disabled.
```

---

### Example

:::tabs
@tab GET
```shell:no-line-numbers
ab -n 1000000 -c 200 -r  "http://localhost:8080/a/b?a=b"
```
@tab POST
```shell:no-line-numbers
ab -n 2000 -c 100 -p lock.json -T 'application/json' "http://127.0.0.1:9501/lock/redis/async"
```
:::

---

### Analysis Of Results

```text:no-line-numbers
This is ApacheBench, Version 2.3 <$Revision: 1901567 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 200 requests
Completed 400 requests
Completed 600 requests
Completed 800 requests
Completed 1000 requests
Completed 1200 requests
Completed 1400 requests
Completed 1600 requests
Completed 1800 requests
Completed 2000 requests
Finished 2000 requests


Server Software:        swoole-http-server
Server Hostname:        127.0.0.1 # 请求的URL主机名
Server Port:            9501 # 请求端口

Document Path:          /lock/redis/async #请求路径
Document Length:        58 bytes #HTTP响应数据的正文长度

Concurrency Level:      100 #并发用户数，这是我们设置的参数之一（-c）
Time taken for tests:   1.936 seconds #所有这些请求被处理完成所花费的总时间 单位秒
Complete requests:      2000 #总请求数量，这是我们设置的参数之一（-n）
Failed requests:        0 #表示失败的请求数量
Non-2xx responses:      2000 
Total transferred:      784000 bytes
Total body sent:        370000
HTML transferred:       116000 bytes
Requests per second:    1033.08 [#/sec] (mean) # 用户平均请求等待时间，计算公式：Time token for tests/（Complete requests/Concurrency Level）。处理完成所有请求数所花费的时间/（总请求数/并发用户数）
Time per request:       96.798 [ms] (mean)
Time per request:       0.968 [ms] (mean, across all concurrent requests)
Transfer rate:          395.48 [Kbytes/sec] received
                        186.64 kb/s sent
                        582.12 kb/s total

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.7      0       5
Processing:    32   91 251.9     37    1440
Waiting:       32   91 251.9     37    1440
Total:         32   92 252.5     37    1444

Percentage of the requests served within a certain time (ms)
  50%     37 # 50%的请求在37毫秒内返回
  66%     38
  75%     39
  80%     40
  90%     42
  95%     80
  98%   1196
  99%   1415 # 99%的请求哎1415毫秒内返回
 100%   1444 (longest request)
```

## Jmeter

### Configuring Thread Group

![](https://img.tzf-foryou.xyz/img/20231227153101.png)

### Add HTTP Request

![](https://img.tzf-foryou.xyz/img/20231227153612.png)

### Add View Results Tree

![](https://img.tzf-foryou.xyz/img/20231227154551.png)

### Add Response Time Graph

![](https://img.tzf-foryou.xyz/img/20231227155119.png)

![](https://img.tzf-foryou.xyz/img/20231227155219.png)

### Add TPS (Transactions Per Second)

![](https://img.tzf-foryou.xyz/img/20231227155548.png)

### Add HTTP Header Manager

![](https://img.tzf-foryou.xyz/img/20231227155709.png)

### Add Post Processor

![](https://img.tzf-foryou.xyz/img/20231227155759.png)