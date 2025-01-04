---
sidebar: [
{text: '📞 Event Mechanism', collapsible: true, children: [
{text: 'Event Roles and Considerations', link: 'hyperf/component/event/event'},
{text: 'Code Example', link: 'hyperf/component/event/code'},
]},
{text: '⏰ Crontab', link: 'hyperf/component/crontab'},
{text: '⛓ Processes', link: 'hyperf/component/process'},
{text: '📝 File System', link: 'hyperf/component/filesystem'},
{text: '🕓 Cache', link: 'hyperf/component/cache'},
{text: '📩 Queue', collapsible: true, children: [
{text: 'Queue Usage', link: 'hyperf/component/queue/overview'},
{text: 'Notes', link: 'hyperf/component/queue/info'},
]},
{text: '🚦 Signal', link: 'hyperf/component/signal'},
{text: '📤 GuzzleHttp', link: 'hyperf/component/guzzle'},
{text: '📉 Rate Limiter', link: 'hyperf/component/limit'},
{text: '❌ Exception', link: 'hyperf/component/exception'},
{text: '🖨 Logs', link: 'hyperf/component/log'},
{text: '📡 Command', link: 'hyperf/component/command'},
{text: '🔁 WebSocket', link: 'hyperf/component/websocket'},
]

prev: /us/hyperf/hyperf_component
next: /us/hyperf/component/event/code

sidebarDepth: 3

---

# Event Roles and Considerations

Index
[[TOC]]

::: tip
- The event mechanism consists of three roles: **`Trigger`** 、 **`Listener`** 、 **`Event`**。
- Events can be classified into system events and custom events; for system events, you can directly write listeners to listen for them. [Etc.](https://hyperf.wiki/3.0/zh-cn/imgs/hyperf-events.svg)
- Event-Role Mapping：![](https://img.tzf-foryou.xyz/img/20220321102539.png)
:::

::: warning 【Guideline】
Many components come with their own listeners, triggers, and events. Generally, the trigger does not require modification and should not be modified by us, as changing the trigger timing can affect the functionality and logic of the component. However, the event may not always meet our requirements, and the same applies to listeners. In such cases, we need to create our own events and listeners, and we should follow the following guidelines: 

1. Create a `Hook` or `Event` directory under the `app` directory, and also create a `Listener` directory. 
2. System-provided listeners should be declared in `config/autoload/listeners`; custom listeners should be created in `app/Listener` and declared using annotations.
3. If the component provides an event but the component's listener does not meet the needs, you can create a custom listener to listen to the event. At this point, you can think of it as: a component being listened to by multiple listeners as long as it's triggered. 
4. Custom events must be triggered in your own business logic and should not be triggered within a package (though most people wouldn't do this anyway :cry:).

:::

---
## Event

> An Event can be understood as a Hook :hook: or an Anchor :anchor:. \
In places where needed, you can embed a suitable `hook` for the current scenario; when the scenario is executed, the hook can trigger `all listeners listening to this hook` to execute the business logic.


## Trigger (Event Dispatcher)

> At this point, we already know the purpose of hooks. So, how are hooks and listeners connected? 
This is where the `trigger` comes into play. As shown in the diagram, a trigger can trigger an event. 
Only after the trigger fires the event can the listeners that are listening to that event (hook) properly listen for it. 
Therefore, `only when the trigger (event dispatcher) fires the event will the listeners for that event be activated!!!`

## Listener

> A listener is where the business logic is executed after an event is triggered. 
When listening for an event, you must ensure that the event has been triggered; 
otherwise, the listener will not catch it. Different listeners should have clear responsibilities. 
It is important not to put all the business logic for different scenarios into a single listener. 
For example, triggering SMS and email sending after registration could be written in a single listener, 
but this is not elegant. It shows a lack of understanding of why the event mechanism is used in the first place.

## Notes

- The relationship between `Event (Hook)` and `Listener` is `many-to-many`. 
That is, an event can be listened to by multiple listeners. 
For example, the `registration event` can have a `send email listener` and a `send SMS listener`, and so on. 
Conversely, multiple events can be listened to by a single listener. 
For instance, the `service startup event`, `service startup success event`, and `service shutdown event` can be handled by a single listener, 
executing different business logic for each event.

- Events must be categorized according to certain rules, such as: `before xxx`, `successfully xxx`, `after xxx`. 
Also, if there is only one listener for an event, writing the business logic directly in the corresponding location is fine. 
However, the advantage of a listener is that **one trigger can activate multiple logic flows, 
and these logic flows can be clearly placed in different listeners to be executed, while the code at the hook point does not need to change,
essentially decoupling the system**.

- Many system events are already triggered by event dispatchers (many components declare and trigger events, and there are corresponding listeners to handle them). 
You only need to add your own listeners. However, some events are not triggered within a coroutine environment, 
so when listening for system events, make sure that they are coroutine-safe.

::: danger 【Warning】
> 1、**Do not** inject `EventDispatcherInterface` in `Listener`

Because `EventDispatcherInterface` depends on `ListenerProviderInterface`, which, upon initialization, 
collects all the listeners. If a listener also depends on `EventDispatcherInterface`, 
it would cause circular dependencies, leading to a memory overflow.

> 2、It is best to inject `ContainerInterface` only in `Listener`

It is recommended to inject ContainerInterface only in the `Listener`. 
Other components should use the container to retrieve dependencies during processing. 
At the start of the framework, EventDispatcherInterface is instantiated, and at this stage, 
it is not in a coroutine environment. 
If a listener injects a class that may trigger a coroutine switch, it will cause the framework to fail to start.
:::