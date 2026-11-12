---
title: "华硕Chromebox 3 CN65在linux下使用ectool给风扇调速"
date: 2026-11-12T22:01:27+08:00
draft: false
description: ""
categories: ["技术折腾"]
tags: ["硬件", "chromebox"]
---

最近到手的华硕chromebox 3，一开机风扇就起飞，于是闲鱼下单换了个风扇，发现新风扇虽然不会起飞但是声音还是比较大，于是想办法给风扇降速，毕竟我这个是3865u的版本，cpu发热不高，甚至不插风扇都问题不大，那么降点速也没啥问题。

在[chrultrabook的文档](https://docs.chrultrabook.com/docs/installing/ectool.html)里查到可以用`ectool`来控制风扇转速。

## 下载`ectool`并设置可执行权限

```bash
sudo -i

mkdir -p /opt/ectool
cd /opt/ectool

wget https://mrchromebox.tech/files/util/ectool.tar.gz

tar -xzf ectool.tar.gz
chmod +x ectool
```

> `ectool help`可以查看`ectool`的可执行操作

> [!NOTE]
> 可能会缺某些`.so`链接文件，根据对应的发行版安装即可

## 直接设置风扇RPM

```bash
ectool pwmsetfanrpm 2000
```

可以先尝试以上命令，再用`ectool pwmgetfanrpm`看转速是否设置成功。
我这里使用以上命令后风扇转速并没有改变，不知道是不是我这台机器不支持直接调速。
而且我还发现这个机器在自动风扇转速下风扇速度一直都是恒定的，不知道是不是主板有啥问题。

## 设置PWM占空比百分比

```bash
ectool fanduty 25
```

这也是chrultrabook文档中提到的设置方法，我用这个方法成功了。
