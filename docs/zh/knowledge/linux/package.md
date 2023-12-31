---
sidebar: [
{text: '🔧 包管理', link: '/zh/knowledge/linux/package'},
{text: '🌈 常用命令', link: '/zh/knowledge/linux/command'},
{text: '🖌 Vim', link: '/zh/knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: '/zh/knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: '/zh/knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: '/zh/knowledge/linux/crontab'},
]

prev: /zh/knowledge/linux
next: /zh/knowledge/linux/command

---

# 包管理

目录
[[TOC]]

## CentOS

::: tip 换源
[阿里云镜像源](https://developer.aliyun.com/mirror/centos)
:::

```shell:no-line-numbers
# 安装指定包
yum install pkg1 pkg2 pkg3 ..
# 列出所有的已经安装的软件 
yum list installed
# 如果要指定安装软件版本，首先可以使用--showduplicates列出可用的版本
yum --showduplicates list pkg
# 全部更新
yum update
# 更新指定包
yum update pkg
# 检查可更新包
yum check-update
yum list updates
# 升级指定程序包
yum upgrade pkg
# 获取包的信息
yum info pkg
# 列出所有可安装的软件包
yum list
# 显示指定程序包安装情况
yum list pkg
# 查看yum基本信息
yum repolist all
# 移除包
yum remove pkg
# 查看程序pkg依赖情况
yum deplist pkg
# 清除缓存目录下的软件包
yum clean packages
# 清除缓存目录下的 headers
yum clean headers
# 清除缓存目录下旧的 headers
yum clean oldheaders
```

## MacOS

::: tip 换源
[更换Brew下载源](/zh/knowledge/mac/brew.html#替换源)
:::

```shell:no-line-numbers
# 更新brew
brew update
# 查看brew版本	
brew -v
# 查看HomeBrew已安装的软件
brew ls
# 查看哪些已经安装的包需要更新
brew outdated
# 更新所有包
brew upgrade
# 更新指定包
brew upgrade pkg
# 清理所有包旧版本
brew cleanup
# 清理指定包旧版本
brew cleanup pkg
# 查看可清理的旧版本包，不执行实际操作
brew clenaup -n 
# 搜索包
brew search 软件名
# 查看包信息
brew info 软件名
# 卸载包
brew uninstall 软件名
```

## Ubuntu(Debian)

::: tip 换源
[阿里云镜像源](https://developer.aliyun.com/mirror/ubuntu)
:::

```shell:no-line-numbers
# 更新源文件，并不会做任何安装升级操作
apt-get update 
# 升级所有已安装的包
apt-get upgrade 
# 安装指定的包
apt-get install packagename 
# 仅升级指定的包
apt-get install packagename --only-upgrade
# 重新安装包
apt-get install packagename --reinstall
# 修复安装
apt-get -f install
# 安装相关的编译环境
apt-get build-dep packagename
# 下载该包的源代码
apt-get source packagename
# 升级系统
apt-get dist-upgrade
# 使用 dselect 升级
apt-get dselect-upgrade
# 搜索包
apt-cache search package
# 获取包的相关信息，如说明、大小、版本等
apt-cache show package
# 了解使用依赖
apt-cache depends package
# 查看该包被哪些包依赖
apt-cache rdepends package 
# 删除包
apt-get remove package
# 删除包及其依赖的软件包+配置文件等
apt-get autoremove packagename --purge
# 清理无用的包
apt-get clean  
# 清理无用的包
apt-get autoclean  
# 检查是否有损坏的依赖
apt-get check 
# 查看已经安装的软件包
apt list --installed
```