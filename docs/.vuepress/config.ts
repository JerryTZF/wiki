import {defaultTheme, defineUserConfig} from "vuepress";

export default defineUserConfig({
    base: '/',
    lang: 'zh-CN',
    title: 'Jerry\'s WIKI',
    description: 'This is Jerry\'s first Vuepress',
    head: [['link', {rel: 'icon', href: '/images/logo.JPG'}]],
    theme: defaultTheme({
        home: '/',
        colorMode: 'auto',
        colorModeSwitch: true,
        backToHome: '页面未找到，请检查路由 :(',
        notFound: ['抱歉，当前页面文档未找到，请联系管理员~'],
        editLink: false,
        tip: '【注意】',
        warning: '【警告】',
        danger: '【危险】',
        selectLanguageText: 'xxx',
        logo: '/images/logo.JPG',
        navbar: [
            {text: '概述', link: '../zh/overview'},
        ],
    }),
})