---
title: "在linux上使用Mtool品鉴RPG小黄油的小tricks"
date: 2026-10-03T19:28:57+08:00
draft: false
description: ""
categories: ["技术折腾", "娱乐游戏"]
tags: ["RPG Maker", "黄油", "proton"]
---

最近一直在使用NixOS作为自己的主力系统。我对这个系统十分中意，一份配置文件到处生成系统的特性非常符合我随时随地重装系统的性癖。

说到性癖，长期与[NixOS](nixos.org)的相处也使我错失了很多发展新XP的机会。

这不，我又开始研究在NixOS上玩小黄油了，主要是RPG Maker制作的那种小黄油。

其实在linux上玩黄油挺简单的，如果是[RPG Maker MV/MZ](https://www.rpgmakerweb.com/products/rpg-maker-mv)制作的黄油，那么直接安装一个[nw.js](nwjs.io)就可以在游戏根目录下`nw .`原生运行(前提是根目录下有`package.json`元文件)了。

## 但是遇到生肉的怎么办？

### [rpgmtranslate](https://github.com/RPG-Maker-Translation-Tools/rpgmtranslate-qt)

AI推荐给我的linux原生的rpg翻译工具，因为NixOS的动态链接库问题我没有测试成功。

而且网上能找到的翻译文件一般都是为MTool准备的json格式，所以能不能直接调用这些预处理翻译文件我也持怀疑态度。

### [MTool](mtool.app)

MTool大家在Windows上都很熟悉了，自然会想到用他来翻译游戏，我当然第一个想到的也是他。

当然，我们可以用[Wine](winehq.org)来直接运行MTool，但是我看到MTool的文件夹下也有`nw.exe`这个文件，于是就想可不可以用`nw.js`直接原生运行MTool呢？

#### Linux原生运行 -> ❌

在MTool的根目录下`nw .`尝试运行：

![nwjs启动MTool1](img/2026/nwjs启动MTool1.png)

显示在更新，更新完后会自动重启，可是我这是linux，当然是重启不了的。

于是我手动再次启动MTool，这次变成了：

![nwjs启动MTool2](img/2026/nwjs启动MTool2.png)
![nwjs启动MTool3](img/2026/nwjs启动MTool3.png)

好吧，看来linux原生运行MTool是指望不上了。

#### [Proton](protondb.com)转译运行 -> ⭕

因为我已经装好了steam，这里就偷了偷懒，直接用protontricks随便借用了一个游戏的运行环境来跑MTool：

![proton借用](img/2026/proton借用.png)

![mtool初见](img/2026/mtool初见.png)

终于我们看到了MTool的界面，于是我迫不及待的用MTool打开了我的“小游戏”……

嘶，游戏是打开了，但是MTool自动重启了而且怎么也识别不到正在运行的游戏：

> 这里只是部分游戏会这样，我测试了其他一个游戏是可以正常识别的

![工具不识别游戏](img/2026/工具不识别游戏.png)

这是我其实已经准备放弃了，但是过了几天在网上冲浪的时候发现了这个[视频](https://www.bilibili.com/video/BV1dcRmBbEEQ)

视频里up主做了点小操作，我就照着尝试了一下：

1. 把MTool取消勾选精简UI

![取消精简UI](img/2026/取消精简Ui.png)

2. 勾选`Wait for external game and inject`

![waitforexternal](img/2026/waitforexternal.png)

接着选择游戏文件，点击`Start Game`:

![识别到游戏](img/2026/识别到游戏.png)

成了！工具可以识别到游戏了，接下来导入翻译文件测试一下！

![翻译成功](img/2026/翻译成功.png) -> ✅

好，我将和NixOS一起品鉴！

---

> [!NOTE]
> 推荐一个Linux工具，可以方便管理`nw.js`版本和支持文本直接复制:
> [rpgmakermlinux-cicpoffs](https://github.com/bakustarver/rpgmakermlinux-cicpoffs)
