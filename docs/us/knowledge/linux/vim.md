---
sidebar: [
{text: '🔧 Package Management', link: 'knowledge/linux/package'},
{text: '🌈 Common Commands', link: 'knowledge/linux/command'},
{text: '🖌 Vim Editor', link: 'knowledge/linux/vim'},
{text: '⚓️ Systemctl', link: 'knowledge/linux/systemctl'},
{text: '🪝 Supervisorctl', link: 'knowledge/linux/supervisorctl'},
{text: '⏰ Crontab', link: 'knowledge/linux/crontab'},
]

prev: /us/knowledge/linux/command
next: /us/knowledge/linux/systemctl

---

# Vim

Index
[[TOC]]

## Cursor Movement

- h or the left arrow key (←)
- j or the down arrow key (↓)
- k or the up arrow key (↑)
- l or the right arrow key (→)
- H: Navigate to the top of the current screen
- M: Navigate to the middle of the current screen
- L: Navigate to the bottom of the current screen
- G: Navigate to the bottom of the current document
- NG (N being a number): Navigate to line N in the document
- gg: Navigate to the first line of the document
- ctrl+b: Scroll one screen up
- ctrl+f: Scroll one screen down

::: tip 【Note】
If you wish to move multiple times, for example, moving down 30 lines, you can use the combination keystrokes "30j" or "30↓", simply add the desired number of repetitions before the action key!
:::

## Search and Replace

- /word: Seek a string named word below the cursor.
- ?word: Seek a string named word above the cursor.
- n: Find the next occurrence.
- N: Find the previous occurrence.
- :%s/word1/word2/g: Search for the word1 string from the first line to the last line and replace it with word2! (commonly used)
- n1,n2s/word1/word2/g: Look for the word1 string between lines n1 and n2 and replace it with word2.


## Copy and Paste

- x, X: Within a line of text, x deletes a character to the right (equivalent to the [del] key), while X deletes a character to the left (equivalent to the [backspace] key). (commonly used)
- dd: Delete the entire line where the cursor is located.
- ndd: Here, n represents a number. Delete n lines downward from the cursor; for instance, 20dd deletes 20 lines. (commonly used)
- yy: Copy the current line.
- nyy: Here, n once again signifies a number. Copy n lines downward from the cursor; for example, 20yy copies 20 lines. (commonly used)
- d1G：Delete all data from the cursor to the first line.
- dG：Delete all data from the cursor to the last line.
- y1G：Copy all data from the line where the cursor is located to the first line.
- yG：Copy all data from the line where the cursor is located to the last line.
- p, P：p pastes the copied data below the cursor, while P pastes it above the cursor.