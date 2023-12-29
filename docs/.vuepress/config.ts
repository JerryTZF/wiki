import {defaultTheme, defineUserConfig} from "vuepress";
import {searchPlugin} from "@vuepress/plugin-search";
import {copyCodePlugin} from "vuepress-plugin-copy-code2";

export default defineUserConfig({
    base: '/',
    lang: 'zh-CN',
    title: 'Jerry\'s WIKI',
    description: 'This is Jerry\'s first Vuepress',
    head: [['link', {rel: 'icon', href: '/images/logo.png'}]],
    theme: defaultTheme({
        home: '/',
        colorMode: 'auto',
        colorModeSwitch: true,
        lastUpdatedText: '更新时间',
        contributorsText: '贡献者',
        backToHome: '溜了，溜了  (●ﾟωﾟ●)',
        notFound: ['我很懒，该页面还没有写呢 😴'],
        editLink: true,
        editLinkText: '编辑此页面',
        docsRepo: 'https://github.com/JerryTZF/wiki',
        docsBranch: 'main',
        docsDir: 'docs',
        tip: '【注意】',
        warning: '【警告】',
        danger: '【危险】',
        selectLanguageText: 'xxx',
        logo: '/images/logo.png',
        navbar: [
            {text: '概述', link: '/zh/overview'},
            {
                text: 'Hyperf', children: [
                    {text: '🐞 web使用', link: '/zh/hyperf/hyperf_web'},
                    {text: '📐 常用组件', link: '/zh/hyperf/hyperf_component'},
                    {text: '💡 使用技巧', link: '/zh/hyperf/hyperf_skill'},
                    {text: '🎱 规范相关', link: '/zh/hyperf/hyperf_standard'},
                ]
            },
            {
                text: '知识体系', children: [
                    {text: '🖥 工作流', link: '/zh/knowledge/workflow'},
                    {text: '🛠 常用工具', link: '/zh/knowledge/tools'},
                    {text: '🌐️ 服务器', link: '/zh/knowledge/linux'},
                    {text: '📦 容器相关', link: '/zh/knowledge/container'},
                    {text: '♨️ 编程语言', link: '/zh/knowledge/language'},
                ]
            },
            {text: '咖啡屋', link: '/zh/coffee/overview'},
            {text: 'Github', link: 'https://github.com/JerryTZF/wiki'},
        ],

    }),

    plugins: [
        searchPlugin({
            locales: {
                '/': {placeholder: '搜索'}
            },
            hotKeys: ['s', '/'],
            maxSuggestions: 10,
        }),
        copyCodePlugin({
            showInMobile: true,
        })
    ],
})