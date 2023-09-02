---
sidebar: [
{text: '📞 事件机制', collapsible: true, children: [
{text: '事件角色和注意事项', link: '/zh/hyperf/component/event/event'},
{text: '代码示例', link: '/zh/hyperf/component/event/code'},
]},
{text: '⏰ 定时任务', link: '/zh/hyperf/component/crontab'},
{text: '⛓ 自定义进程', link: '/zh/hyperf/component/process'},
{text: '📝 文件系统', link: '/zh/hyperf/component/filesystem'},
{text: '🕓 缓存系统', link: '/zh/hyperf/component/cache'},
{text: '📩 异步队列', link: '/zh/hyperf/component/queue'},
{text: '🚦 信号处理器', link: '/zh/hyperf/component/signal'},
{text: '📤 http', link: '/zh/hyperf/component/guzzle'},
{text: '📉 限流器', link: '/zh/hyperf/component/limit'},
{text: '📮 异步Task', link: '/zh/hyperf/component/task'},
{text: '❌ 异常处理器', link: '/zh/hyperf/component/exception'},
{text: '🖨 日志', link: '/zh/hyperf/component/log'},
]

prev: /zh/hyperf/hyperf_component
next: /zh/hyperf/component/event/code

sidebarDepth: 3

---

# 角色及注意事项

目录
[[TOC]]

::: tip
- 事件机制共分为三个角色：**`触发器`** 、 **`监听器`** 、 **`事件`**。
- 事件可以分为系统事件、自定义事件；对于系统事件，可以直接写监听器进行监听，[详见图](https://hyperf.wiki/3.0/zh-cn/imgs/hyperf-events.svg)
- 对应关系：![](http://img.tzf-foryou.xyz/img/20220321102539.png)
:::

::: warning 【规范】
很多组件是自带监听器、触发器、事件的，一般的，触发器是不需要我们修改，也不应该我们修改的，因为修改触发时机会影响该组件的功能和逻辑，
但是事件并不一定能满足我们的需求，监听器同理。那么就需要我们编写自己的事件和监听器，我们也应当遵循以下规范：

1、应当在 `app` 目录下创建 `Hook` 或者 `Event` 目录，同时创建 `Listener` 目录。 \
2、系统提供的监听器应当在 `config/autoload/listeners` 中声明；自定义监听器在 `app/Listener` 中创建，并且使用注解进行声明。 \
3、组件提供事件，但是组件的监听器不满足需求时，可以自定义监听器监听该事件，此时你可以理解为：一个组件被多个监听器监听，只要它被触发。\
4、自定义事件必须在自己的业务逻辑中触发，不能在包中触发(一般人也不会这么干 :cry: )

:::

---
## 事件

事件`(Event)`可以理解为：`钩子(Hook)` :hook: 或者 `锚点(Anchor)` :anchor: \
在需要的地方，可以埋入适合当前场景的**钩子**；执行当前场景时，可以通过钩子，触发`监听该钩子的所有的监听器`执行业务逻辑。


## 触发器(事件调度器)

我们此时已经知道钩子的作用，那么钩子和监听器之间是如何联系起来的呢？这里就需要触发器实现，由上图看出，一个触发器可以触发一个事件，
只有当触发器触发事件后，监听该事件(钩子)的监听器才可以正常监听到该事件，所以，**只有触发器(事件调度器)触发该事件，监听该事件的监听器才会生效!!!**

## 监听器

监听器是触发事件后业务逻辑实现的地方，在监听事件时，一定要注意事件是否被触发，不然不会被监听器监听到。不同的监听器应该是责任清晰的，
切不可把所有的不同情况下业务逻辑写到一个监听器中，直接梭哈；例如注册后触发短信、Email发送，虽然写在一个监听器中可以实现，但是这种是
不优雅的，没有弄明白为什么要用事件机制的。

## 注意事项

- `事件(钩子)` 与 `监听器` 之间是 `多对多` 的关系。即：一个事件可以被多个监听器监听，例如`注册事件`，可以有`注册后发邮件监听器`、`注册后发短信监听器`
  等等。多个事件被一个监听器监听，例如`服务启动前事件`、`服务启动成功事件`、`服务退出后事件`，被一个监听器监听，对于不同的事件做出不同的业务逻辑处理。
- 事件一定要按照某种规则进行划分，常见的：`xxx前`、`xxx成功` 、`xxx后`。其次，事件的监听器如果只有一个，那么把业务逻辑同步写在对应的位置也没什么不可。
  所以监听器的优势就在于：**一个节点触发多种逻辑，多种逻辑可以清晰的放在不同的监听器中执行，而钩子所在处代码无需变更，本质上是解耦。**
- 很多的系统事件已经被触发器触发(很多组件内也是声明了事件然后触发，并且有对应监听器对其监听)，只需要添加自己的监听器即可，
  但是有一些是不在协程环境下触发，所以在监听系统事件时，一定要注意是否是协程安全。

::: danger 【格外注意】
> 1、不要在 `Listener` 中注入 `EventDispatcherInterface`

因为 EventDispatcherInterface 依赖于 ListenerProviderInterface，而 ListenerProviderInterface 初始化的同时，会收集所有的 Listener。
而如果 Listener 又依赖了 EventDispatcherInterface，就会导致循坏依赖，进而导致内存溢出

> 2、最好只在 `Listener` 中注入 `ContainerInterface`

最好只在 Listener 中注入 ContainerInterface，而其他的组件在 process 中通过 container 获取。框架启动开始时，会实例化 EventDispatcherInterface，这个时候还不是协程环境，如果 Listener 中注入了可能会触发协程切换的类，就会导致框架启动失败。
:::