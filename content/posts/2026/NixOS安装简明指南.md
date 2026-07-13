---
title: "NixOS安装简明指南（基于Flakes + Home Manager）"
date: 2026-07-12T23:50:56+08:00
draft: false
description: ""
categories: ["技术折腾"]
tags: ["nixos", "linux"]
---

> 此文章基于此视频：
> {{< youtubeLite id="2QjzI5dXwDY" label="How to Install NixOS From Scratch (2026 Edition) | Flakes + Home Manager Full Guide" >}}

第一步当然是启动NixOS LiveCD了，这里不过多介绍。

## 前置杂项

### 切到root用户

```bash
sudo -i
```

## 硬盘分区

### 确认目前硬盘对应设备名

```bash
lsblk
```

### 分区

```bash
cfdisk /dev/sda # change sda to your dedicated device name
```

> 示例分区表：
> |Device|Size|Type|
> |---|---|---|
> |/dev/sda1|1G|EFI System|
> |/dev/sda2|4G|Linux swap|
> |/dev/sda3|50G|Linux filesystem|

### 确认分区表

```bash
lsblk
```

### 建立文件系统

```bash
mkfs.ext4 -L nixos /dev/sda3
mkswap -L swap /dev/sda2
mkfs.fat -F 32 -n boot /dev/sda1
```

### 挂载分区

```bash
mount /dev/sda3 /mnt
mount --mkdir /dev/sda1 /mnt/boot
```

### 创建交换分区

```bash
swapon /dev/sda2
```

### 再次确认

```bash
lsblk
```

## 生成NixOS配置

```bash
nixos-generate-config --root /mnt
```

---

以下separate from official NixOS installation.

### 使用flake和home-manager进行管理

```bash
cd /mnt/etc/nixos
touch flake.nix home.nix
```

#### `flake.nix`

```nix
{
  description = "NixOS from Scratch";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-26.05";
    home-manager = {
      url = "github:nix-community/home-manager/release-26.05";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, ... }: {
    nixosConfigurations.nixos-btw = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
        home-manager.nixosModules.home-manager
        {
          home-manager = {
            useGlobalPkgs = true;
            useUserPackages = true;
            users.light = import ./home.nix;
            backupFileExtension = "backup";
          };
        }
      ];
    };
  };
}
```

#### `configuration.nix`

```nix
{ config, lib, pkgs, ... }:

{
  imports =
    [
      ./hardware-configuration.nix
    ];

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "nixos-btw";
  networking.networkmanager.enable = true;

  time.timeZone = "Asia/Shanghai";

  users.users.light = {
    isNormalUser = true;
    extraGroups = [ "wheel" ];
    packages = with pkgs; [
      tree
    ];
  };

  environment.systemPackages = with pkgs; [
    vim
    wget
    git
  ];

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  system.stateVersion = "26.05";
}
```

#### `home.nix`

```nix
{ config, pkgs, ... }:

{
  home.username = "light";
  home.homeDirectory = "/home/light";
  programs.git.enable = true;
  home.stateVersion = "26.05";
  programs.bash = {
    enable = true;
    shellAliases = {
      btw = "echo i use nixos, btw";
    };
  };
}
```

## 安装NixOS

```bash
nixos-install --flake /mnt/etc/nixos#nixos-btw
```

## 设置用户密码

```bash
nixos-enter --root /mnt -c 'passwd light'
```

## 重启

```bash
reboot
```
