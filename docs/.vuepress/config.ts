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
        backToHome: '页面未找到，请检查路由 :(',
        notFound: ['抱歉，当前页面文档未找到，请联系管理员~'],
        editLink: false,
        tip: '【注意】',
        warning: '【警告】',
        danger: '【危险】',
        selectLanguageText: 'xxx',
        logo: '/images/logo.png',
        navbar: [
            {text: '概述', link: '/zh/overview'},
            {
                text: 'Hyperf', children: [
                    {text: 'web使用', link: '/zh/hyperf/hyperf_web'},
                    {text: '常用组件', link: '/zh/hyperf/hyperf_component'},
                    {text: '使用技巧', link: '/zh/hyperf/hyperf_skill'},
                    {text: '规范相关', link: '/zh/hyperf/hyperf_standard'},
                ]
            },
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