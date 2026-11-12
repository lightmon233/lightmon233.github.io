---
title: "飞牛os网卡启用ovs后掉网卡掉ip的打补丁方案"
date: 2026-11-12T16:53:37+08:00
draft: false
description: ""
categories: ["技术折腾"]
tags: ["飞牛os", "虚拟机", "计算机网络", "ovs"]
---

> 本文中使用的飞牛系统版本为`1.2.1010`。

## 缘起

某天晚上回到宿舍，闲得蛋疼，给小主机中运行的飞牛安装了immortalwrt虚拟机，让他的虚拟lan口和小主机的物理lan口桥接，然后小主机的无线网卡直通给immortalwrt虚拟机做wwan，以此将路由和NAS的服务合二为一，都让这台小主机负责，这样就能解放我另一台正在顺跑immortalwrt的笔记本，好让我把它挂闲鱼美美出掉。

可是就在我全部折腾完后，脚一抽，把桌底的电源线给踢掉了。就这样，一个断电重启后，飞牛直接连不上了！接上显示器后发现ip都没了，用`ip a`查看发现接口都down了。

我在网上搜罗了一圈，发现有很多人都遇到和我类似的状况，疑似是因为ovs还不够稳定，且其在不同型号的网卡上的兼容性都各不相同。另外因为我这台机器的网卡是RTL8111，不是intel i219那个有驱动bug导致死锁的家伙，所以姑且排除了[这篇帖子](https://club.fnnas.com/forum.php?mod=viewthread&tid=64514&extra=page%3D1)中提到的原因。之后我还尝试了使用热度较高的[这篇帖子](https://club.fnnas.com/forum.php?mod=viewthread&tid=17595)中的systemctl服务文件，但是并没有任何作用。

> 飞牛使用虚拟机需要开启网卡的ovs功能，这样才能把物理网卡挂和虚拟机的虚拟网口挂到同一个虚拟网桥上。

于是我只能用最原始的方法，尝试手动up网卡后再手动添加ip。用`ip link set "eno0-ovs" up `之后，网卡的接口的状态变成了`unknown`，于是用`ip addr replace "192.168.10.176" dev "eno0-ovs"`添加ip，终于可以连上飞牛了。

> 这里我不清楚`unknown`这个状态是否代表网卡出了问题

由于我的skill issue，之后我也没有找到导致这个问题的根因。于是我就只好设法将上面的解决方案持久化，像打补丁一样解决这个忧患，并尽可能地把对系统造成的影响降成最低，毕竟谁也不知道飞牛后续会不会在某次更新中把这个bug直接解决了。

接下来就是我(被ChatGPT夺舍版)的方案：

---

## 补丁

> 原理：设置watchdog每隔30s检查一次`eno0-ovs`接口，只要接口DOWN，或者没有ipv4地址，就自动拉起接口并设置ip

### 创建自动修复脚本

`/usr/local/bin/check-eno0-ovs.sh`

```bash
#!/bin/bash

IFACE="eno0-ovs"
IP="192.168.10.176/24"
GATEWAY="192.168.10.1"
LOG="/var/log/eno0-ovs-watchdog.log"

# 检查接口是否存在
ip link show "$IFACE" >/dev/null 2>&1 || exit 0

# 检查接口是否 DOWN
if ! ip link show "$IFACE" | grep -q "<.*UP"; then
    echo "$(date) Interface DOWN, bringing UP" >> "$LOG"
    ip link set "$IFACE" up
fi

# 检查是否有指定 IPv4
if ! ip -4 addr show dev "$IFACE" | grep -q "192.168.10.176/24"; then
    echo "$(date) IPv4 missing, assigning $IP" >> "$LOG"
    ip addr replace "$IP" dev "$IFACE"
fi

# 检查默认网关是否正确
if ! ip route show default | grep -q "via $GATEWAY dev $IFACE"; then
    echo "$(date) Default gateway incorrect, setting $GATEWAY" >> "$LOG"
    ip route replace default via "$GATEWAY" dev "$IFACE"
fi

# 检查并修复 DNS
DNS="192.168.10.1"

if ! grep -q "^nameserver $DNS$" /etc/resolv.conf; then
    echo "$(date) DNS incorrect, setting $DNS" >> "$LOG"
    printf "nameserver %s\n" "$DNS" > /etc/resolv.conf
fi
```

#### 设置执行权限

```bash
sudo chmod +x /usr/local/bin/check-eno0-ovs.sh
```

### 设置定时服务

`/etc/systemd/system/eno0-ovs-watchdog.service`

```ini
[Unit]
Description=eno0-ovs Network Auto Recovery

[Service]
Type=oneshot
ExecStart=/usr/local/bin/check-eno0-ovs.sh
```

### 创建定时器

`/etc/systemd/system/eno0-ovs-watchdog.timer`

```ini
[Unit]
Description=eno0-ovs Network Watchdog

[Timer]
OnBootSec=10
OnUnitActiveSec=30
Unit=eno0-ovs-watchdog.service

[Install]
WantedBy=timers.target
```

### 启用服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now eno0-ovs-watchdog.timer
```

> 可以通过此命令查看脚本的运行日志:
> `sudo tail -f /var/log/eno0-ovs-watchdog.log`

> 可以通过此命令检查定时器服务状态:
> `systemctl status eno0-ovs-watchdog.timer`

> [!NOTE]
> 192.168.10.176 必须是你局域网内可用且未被其他设备占用的地址。
>
> 这套脚本只负责配置 IPv4，不会自动配置默认网关。如果 OVS 的桥接关系或物理网卡本身出现故障，也不一定能恢复网络。
> 
> 另外，ip addr replace 不会删除其他 IPv4 地址。

---

重启后我们可以通过`tail`命令看到我们的修复脚本的执行历史了：

```log
admin@ASUS-Chromebox:/$ sudo tail -f /var/log/eno0-ovs-watchdog.log 
[sudo] password for admin: 
Thu Nov 12 11:44:06 AM CST 2026 IPv4 missing, assigning 192.168.10.176/24
Thu Nov 12 12:21:20 PM CST 2026 Default gateway incorrect, setting 192.168.10.1
Thu Nov 12 01:20:36 PM CST 2026 Interface DOWN, bringing UP
Thu Nov 12 01:20:36 PM CST 2026 IPv4 missing, assigning 192.168.10.176/24
Thu Nov 12 01:20:36 PM CST 2026 Default gateway incorrect, setting 192.168.10.1
Thu Nov 12 01:20:36 PM CST 2026 DNS incorrect, setting 192.168.10.1
Thu Nov 12 01:39:56 PM CST 2026 Interface DOWN, bringing UP
Thu Nov 12 01:39:56 PM CST 2026 IPv4 missing, assigning 192.168.10.176/24
Thu Nov 12 01:39:56 PM CST 2026 Default gateway incorrect, setting 192.168.10.1
Thu Nov 12 01:39:56 PM CST 2026 DNS incorrect, setting 192.168.10.1
```

可以看到我们重启机器后脚本执行了一次，之后过了19分钟接口又down了，于是脚本再次执行了一次。可见这个bug就算手动up了接口后仍然有概率再次触发，必须设置循环检测才可破解。

