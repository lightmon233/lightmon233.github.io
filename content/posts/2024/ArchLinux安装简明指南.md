---
title: "ArchLinux安装简明指南"
date: 2024-09-12T17:23:25+08:00
draft: false
description: ""
categories: ["技术折腾"]
tags: ["arch linux", "linux"]
---
{{< katex >}}


> 本指南将介绍如何不借用`archinstall`脚本来安装纯命令行界面的ArchLinux到64位系统上。（UEFI+GPT）

# 零、安装前准备

首先当然是先进入`liveiso`环境。

增大字号：
```bash
setfont ter-132n
```

测试网络连接是否顺畅：
```bash
ping archlinux.org -c 5
```

验证系统是否在UEFI模式下启动
```bash
ls /sys/firmware/efi/efivars/
```
如果输出了一大堆内容就代表是UEFI模式

# 一、时间与键盘布局

## 系统时间配置

查看系统时间配置：
```bash
timedatectl status
```

更改时区设置：
```bash
timedatectl set-timezone Asia/Shanghai
```

设置同步服务器：
```bash
timedatectl set-ntp true
```

## 键盘布局

载入键盘布局
```bash
loadkeys /usr/share/kbd/keymaps/i386/qwerty/us.map.gz
```

# 二、硬盘分区与挂载

查看所有硬盘分区及挂载点
```bash
lsblk
```

## 硬盘分区

以系统只有单硬盘sda为例
```bash
cfdisk /dev/sda
```

安装ArchLinux一般分三个区分别给`/`，`/boot`，和`swap分区`使用。

ArchWiki建议的一种分区布局：

Mount point on the installed system | Partition | Partition type | Suggested size
:-: | :-: | :-: | :-:
`/boot` | `/dev/sda1` | :EFI system partition | 1GiB
`[SWAP]` | `/dev/sda2` | :Linux swap | The size of RAM to use hibernation
`/` | `/dev/sda3` | :Linux x86-64 root(/) | At least 23-32GiB

安装时不一定要按照这个布局来，也可以给`/home`（家目录，存放文件），`/var`（主要存放pacman的下载缓存和一些变量variable），`/opt`（一些大型软件的默认下载目录和自定义的软件下载目录optional）分配到其他分区，分区类型都设置为`:Linux filesystem`即可。

> :warning: 最好不要将`/etc`和`/usr`挂到和`/`不同的分区上，这两个路径和系统高度绑定，挂到不同的分区上会无法在系统启动的时候自动挂载，虽然有解决方法，但是比较麻烦且容易引发错误。

## 路径挂载

以上面的布局为例

### 建立文件系统（格式化）：
```bash
mkfs.ext4 /dev/sda3
mkswap /dev/sda2
swapon /dev/sda2
mkfs.fat -F 32 /dev/sda1
```

### 挂载分区
```bash
mount /dev/sda3 /mnt
mount /dev/sda1 /mnt/boot
```

# 三、安装ArchLinux本体

## 更换国内软件仓库镜像源

```bash
vim /etc/pacman.d/mirrorlist
```

镜像源地址：
```bash
Server = https://mirrors.ustc.edu.cn/archlinux/\(repo/os/\)arch # 中国科学技术大学开源镜像站
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/\(repo/os/\)arch # 清华大学开源软件镜像站
Server = https://repo.huaweicloud.com/archlinux/\(repo/os/\)arch # 华为开源镜像站
Server = http://mirror.lzu.edu.cn/archlinux/\(repo/os/\)arch # 兰州大学开源镜像站
```

## 安装ArchLinux到`/mnt`

```bash
pacstrap -i /mnt base base-devel linux [linux-lts] linux-headers linux-firmware intel-ucode [amd-ucode](amd的cpu) sudo nano vim git [neofetch](deprecated) fastfetch networkmanager dhcpcd [pulseaudio](deprecated) pipewire [bluez](蓝牙模块) [wpa_supplicant](wlan)
```

## 生成文件系统表（FSTAB）

目前根目录被挂载到了/mnt, 但是当我们开机从主驱动器启动arch时，我们需要告诉系统将所有这些分区挂载到同一位置
```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

# 四、系统配置

进入安装好的ArchLinux的根目录
```bash
arch-chroot /mnt
```

## 设置账户和密码

设置root用户密码
```bash
passwd
```

### 添加新用户
```bash
useradd -m light
passwd light
```
#### 为新用户添加root权限
```bash
usermod -aG wheel,storage,power light
```
通过`sudo`执行root权限
```bash
visudo
```
将文件这一行：
```bash
# %wheel ALL=(ALL) ALL
```
取消注释，并在其下面一行添加：
```bash
Defaults timestamp_timeout=0
```

## 设置系统语言
```bash
vim /etc/locale.gen
```
把需要的语言取消注释

生成语言locale
```bash
locale-gen
```

生成locale配置：
```bash
echo LANG=en_US.UTF-8 > /etc/locale.conf
```

在当前终端环境使用系统语言：
```bash
export LANG=en_US.UTF-8
```

## 设置主机名
```bash
echo ArchLinux > /etc/hostname
```

修改hosts文件内容
```bash
vim /etc/hosts
```
增加新内容：
```bash
127.0.0.1	localhost
::1		localhost
127.0.0.1	ArchLinux.localdomain	localhost
```

## 设置时区

链接localtime
```bash
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```
### 同步时钟
```bash
hwclock --systohc
```

# 五、安装Grub

`/dev/sda1`是efi分区，grub将会被安装到这里。

安装grub及引导相关软件包：
```bash
pacman -S grub efibootmgr dosfstools mtools
```

## `grub-install`
```bash
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=grub_uefi --recheck
```

## `grub-mkconfig`
```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

# 六、启动服务

## 启动网络服务
```bash
systemctl enable dhcpcd.service
systemctl enable NetworkManager.service
```

# 七、退出

回到liveiso：
```bash
exit
```

卸载所有分区：
```bash
umount -lR /mnt
```

重启并取出u盘
```bash
reboot
```
