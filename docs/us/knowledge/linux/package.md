---
sidebar: [
{text: '🔧 Package Management', link: 'knowledge/linux/package'},
{text: '🌈 Common Commands', link: 'knowledge/linux/command'},
{text: '🖌 Vim Editor', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /us/knowledge/linux
next: /us/knowledge/linux/command

---

# Package Management

Index
[[TOC]]

## CentOS

::: tip Updating Repositories
[Alibaba](https://developer.aliyun.com/mirror/centos)
:::

```shell:no-line-numbers
# Install specific packages
yum install pkg1 pkg2 pkg3 ..
# List all installed software
yum list installed
# To install a specific software version, you can first use --showduplicates to list available versions
yum --showduplicates list pkg
# Update all packages
yum update
# Update a specific package
yum update pkg
# Check for available updates
yum check-update
yum list updates
# Upgrade a specific program package
yum upgrade pkg
# Get information about a package
yum info pkg
# List all installable software packages
yum list
# Display installation status of a specific program package
yum list pkg
# View basic information about yum
yum repolist all
# Remove a package
yum remove pkg
# Check package dependencies for pkg
yum deplist pkg
# Clear software packages in the cache directory
yum clean packages
# Clear headers in the cache directory
yum clean headers
# Clear old headers in the cache directory
yum clean oldheaders
```

## MacOS

::: tip Updating Repositories
[Change Brew](/us/knowledge/mac/brew.html#替换源)
:::

```shell:no-line-numbers
# Update brew
brew update
# Check brew version	
brew -v
# List installed software by HomeBrew
brew ls
# Check which installed packages need updating
brew outdated
# Update all packages
brew upgrade
# Update a specific package
brew upgrade pkg
# Clear all outdated versions of packages
brew cleanup
# Clear outdated versions of a specific package
brew cleanup pkg
# View outdated versions available for cleanup without executing the actual operation
brew cleanup -n 
# Search for a package
brew search software_name
# View package information
brew info software_name
# Uninstall a package
brew uninstall software_name

```

## Ubuntu(Debian)

::: tip Updating Repositories
[Alibaba](https://developer.aliyun.com/mirror/ubuntu)
:::

```shell:no-line-numbers
# Update the source files without performing any installation or upgrade operations
apt-get update 
# Upgrade all installed packages
apt-get upgrade 
# Install a specific package
apt-get install packagename 
# Only upgrade a specific package
apt-get install packagename --only-upgrade
# Reinstall a package
apt-get install packagename --reinstall
# Repair installation
apt-get -f install
# Install related build environments
apt-get build-dep packagename
# Download the source code for a package
apt-get source packagename
# Upgrade the system
apt-get dist-upgrade
# Upgrade using dselect
apt-get dselect-upgrade
# Search for a package
apt-cache search package
# Get package-related information such as description, size, version, etc.
apt-cache show package
# Learn about dependencies
apt-cache depends package
# Check which packages depend on a specific package
apt-cache rdepends package 
# Remove a package
apt-get remove package
# Remove a package along with its dependent software packages, configuration files, etc.
apt-get autoremove packagename --purge
# Clean up unused packages
apt-get clean  
# Clean up unused packages
apt-get autoclean  
# Check for any broken dependencies
apt-get check 
# View the list of installed software packages
apt list --installed

```