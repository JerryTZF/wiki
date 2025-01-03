---
sidebar: [
{text: '🚩 版本控制(Git)', collapsible: true, children:[
{text: '秘钥的配置和使用', 'link': 'knowledge/git/keys'},
{text: '多平台多仓库秘钥管理', 'link': 'knowledge/git/multiple'},
{text: '多人协同开发', 'link': 'knowledge/git/cooperation'},
{text: '常见场景和对策', 'link': 'knowledge/git/qa'},
{text: '其他', 'link': 'knowledge/git/others'},
]},
{text: '✏️ 编辑器(Idea)', collapsible: true, children:[
{text: '快捷键修改', 'link': 'knowledge/idea/keymap'},
{text: 'VCS操作', 'link': 'knowledge/idea/vcs'},
{text: '其他', 'link': 'knowledge/idea/theme'},
]},
{text: '🎁 调试工具', collapsible: true, children: [
{text: '压测工具', 'link': 'knowledge/debug/jmeter'},
{text: 'API测试', 'link': 'knowledge/debug/postman'},
{text: '抓包工具', 'link': 'knowledge/debug/charles'},
]},
{text: '🔭 客户端', collapsible: true, children: [
{text: 'Navicat', 'link': 'knowledge/client/navicat'},
{text: 'Mredis', 'link': 'knowledge/client/mredis'},
{text: 'DockerDesktop', 'link': 'knowledge/client/docker'},
]},
{text: '🍎 Mac工具', collapsible: true, children: [
{text: 'Brew', 'link': 'knowledge/mac/brew'},
{text: 'Iterm2', 'link': 'knowledge/mac/iterm2'},
]},
{text: '🌈 杂项', collapsible: true, children: [
{text: '列表', 'link': 'knowledge/sundry/picgo'},
]}
]

prev: /knowledge/idea/theme
next: /knowledge/debug/postman
---

# 压测工具

目录
[[toc]]

## AB

> ab是apachebench命令的缩写，ab命令会创建多个并发访问线程，模拟多个访问者同时对某一HTTP URL地址进行访问。

### 常用参数

```text:no-line-numbers
-n 测试会话中所执行的请求个数,默认仅执行一个请求,如果不指定-t参数，默认执行完所有请求后自动结束压测。
-c 一次产生的请求个数,即同一时间发出多少个请求,默认为一次一个,此参数可以控制对服务器的单位时间内的并发量。
-t 测试所进行的最大秒数,默认为无时间限制....其内部隐含值是[-n 50000],它可以使对服务器的测试限制在一个固定的总时间以内,如果时间到了，请求个数还未执行完，也会被停止。
-p 包含了需要POST的数据的文件,数据格式以接口请求参数定义的格式为准,eg. xxx.json。
-T POST 数据所使用的Content-type头信息,指定请求参数格式，eg. application/json。
-r 在接口返回失败后，默认会终止压测，添加此参数后压测会继续进行。
-C 对请求附加一个Cookie行，其典型形式是name=value的参数对,此参数可以重复。
-H 对请求附加额外的头信息,此参数的典型形式是一个有效的头信息行,其中包含了以冒号分隔的字段和值的对(如"Accept-Encoding:zip/zop;8bit")。
-X 对请求使用代理服务器。
-k 启用HTTP KeepAlive(长连接)功能,即在一个HTTP会话中执行多个请求,默认为不启用KeepAlive功能。
```

---

### 压测示例

:::: code-group
::: code-group-item GET
```shell:no-line-numbers
ab -n 1000000 -c 200 -r  "http://localhost:8080/a/b?a=b"
```
:::
::: code-group-item POST
```shell:no-line-numbers
ab -n 2000 -c 100 -p lock.json -T 'application/json' "http://127.0.0.1:9501/lock/redis/async"
```
:::
::::

---

### 结果分析

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

### 配置线程组

![](https://img.tzf-foryou.xyz/img/20231227153101.png)

### 添加http请求

![](https://img.tzf-foryou.xyz/img/20231227153612.png)

### 添加观察树

![](https://img.tzf-foryou.xyz/img/20231227154551.png)

### 添加响应时间图

![](https://img.tzf-foryou.xyz/img/20231227155119.png)

![](https://img.tzf-foryou.xyz/img/20231227155219.png)

### 添加tps组件

![](https://img.tzf-foryou.xyz/img/20231227155548.png)

### 添加头信息管理器

![](https://img.tzf-foryou.xyz/img/20231227155709.png)

### 添加后置处理器

![](https://img.tzf-foryou.xyz/img/20231227155759.png)