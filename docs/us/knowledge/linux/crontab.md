---
sidebar: [
{text: '🔧 Package Management', link: 'knowledge/linux/package'},
{text: '🌈 Common Commands', link: 'knowledge/linux/command'},
{text: '🖌 Vim Editor', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /us/knowledge/linux/supervisorctl
next: /us/knowledge/linux

---

# Crontab

Index
[[TOC]]

**Options:：**

> -e: Edit the timer settings for the specified user;\
> -l: List the timer settings for the specified user;\
> -r: Remove the timer settings for the specified user;\
> -u: Specify the username for which the timer is to be set;

---

- **The crontab file located in the `/etc` directory manages periodic tasks such as writing cached data to the disk and cleaning logs. It serves as the configuration file for system task scheduling.**
- **Tasks that users wish to perform periodically, such as data backups and scheduled email reminders, can be customized using the crontab tool. All user-defined crontab files are stored in the `/var/spool/cron` directory.**

---

**Template file**

```shell:no-line-numbers
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

# Specifies the shell the system should use
SHELL=/bin/sh
# Specifies the path to execute system commands
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# Specifies that crond's task execution information will be sent via email to the root user
MAILTO=root

# For details, refer to man 4 crontabs

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed

```

---

**Example**

```shell:no-line-numbers
# Write the script content to the null device
*/5 * * * * /root/XXXX.sh &>/dev/null 2>&1
# Write the script content to the specified file
*/5 * * * * /root/XXXX.sh > /tmp/load.log 2>&1 &

```

```shell:no-line-numbers
# Execute every minute
* * * * * command
# Execute at the 3rd and 15th minute of every hour
3,15 * * * * command
# Execute at the 3rd and 15th minute of 8 to 11 in the morning
3,15 8-11 * * * command
# Execute at the 3rd and 15th minute of 8 to 11 in the morning every Monday
3,15 8-11 * * 1 command
# Restart smb at 21:30 every night
30 21 * * * /etc/init.d/smb restart
# Restart smb at 4:45 on the 1st, 10th, and 22nd of every month
45 4 1,10,22 * * /etc/init.d/smb restart
# Restart smb at 1:10 on Saturdays and Sundays
10 1 * * 6,0 /etc/init.d/smb restart
# Restart smb every 30 minutes between 18:00 and 23:00 every day
0,30 18-23 * * * /etc/init.d/smb restart
# Restart smb every hour between 23:00 and 07:00
* 23-7/1 * * * /etc/init.d/smb restart
# Restart smb on the 4th of every month and at 11:00 on Mondays to Wednesdays
0 11 4 * mon-wed /etc/init.d/smb restart
# Restart smb at 4:00 on the 1st of January
0 4 1 jan * /etc/init.d/smb restart

```

::: tip 【Note】
It is essential to use absolute paths in the crontab file, including for any custom scripts you have written.
:::