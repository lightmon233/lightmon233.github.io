---
title: "RTL8152 USB网卡导致OpenWrt软路由死机问题解决"
date: 2026-10-03T16:20:35+08:00
draft: false
description: ""
categories: ["技术折腾"]
tags: ["openwrt", "软路由"]
---

我买过两张USB有线网卡，一个是魔可灵CH1608S-AX88179芯片，另一个是RTL8153B芯片。

其中魔可灵的网卡我放在家里软路由上长期稳定运行，但是8153B只要插到软路由上必死机，只能重启系统。

在网上翻阅，[这篇帖子](https://www.bilibili.com/opus/1022228673452834819)给出了问题原因和解决方案。

## 原因

> Realtek 8152 USB 网卡在 Scatter/Gather（sg）打开时，驱动存在 BUG 或兼容性问题，在高负载、大流量下就极易出现发送队列卡死，导致 tx timeout。

而我的8153B用的正是rtl8152的兼容驱动，因此遇到了同样的驱动bug导致死机。

## 解决方案

### 一次性

执行`ethtool -K eth1 sg off`。

> 其中<eth1>根据情况换成你的网口名，一般机器有一个内置网口的话，这个USB网口就叫<eth1>，反之如果机器没有内置RJ45网口的话，这个USB网口就叫<eth0>

### 持久化

利用openwrt的hotplug事件机制，在网络接口`ifup`时自动执行命令。

在`/etc/hotplug.d/iface`下新建脚本，比如命名为`99-ethtool`，内容如下：

```bash
#!/bin/sh

[ "$ACTION" = "ifup" -a "$INTERFACE" = "wan" ] && {

  ethtool -K eth1 sg off

}
```

> <eth1>同样换成你的网口名，同时<wan>也要根据你的情况变更，比如改为<lan>

重启系统即可享用脚本。

---

## 总结

不要贪小便宜买螃蟹的USB网卡，能上PCIE就尽量上PCIE网卡！
