#!/usr/bin/env node

/**
 * 工作端 - 终端(命令行) - 入口模块
 */

const fs = require('fs');

//获取命令内容
let [nodePath, mainPath, command, ...parameters] = process.argv;
//转换 linux 下软链接路径为真实路径
mainPath = fs.realpathSync(mainPath);

// co 模块，异步函数编程
const co = require('../modules/co');

//在全局变量上绑定 alert、confirm2、prompt2 方法，作为命令行输出与交互
({alert: global.alert, confirm2: global.confirm2, prompt2: global.prompt2} = require('./messageBox'));

// wiki 创建器
const creator = require('../build/creator');
//文库管理
const mngWiki = require('../build/manageWiki');
//文件夹管理
const mngFolder = require('../build/manageFolder');
//手动刷新导航文件
const makeNav = require('../build/makeNavigation');
//本地服务器模块
const localServer = require('../build/localServer');
//项目导出模块
const exportGithub = require('../build/exportGithub');

//格式化显示
const printFn = require('./printf');

//项目根目录
const root = mngFolder.isAmWiki(process.cwd());
const wikis = {};

co(function*() {

    //执行命令
    switch (command) {
        //依据引导创建 wiki
        case 'init':
            break;
        //依据 config.json 创建 wiki
        case 'create':
        case '-c':
            // config.json 文件路径
            const configPath = process.cwd().replace(/\\/g, '/') + '/config.json';
            //项目 files 文件夹路径
            const filesPath = mainPath.replace(/\\/g, '/').split('bin')[0] + 'files/';
            //开始创建
            const root2 = yield creator.create(configPath, filesPath);
            if (!root2) {
                break;
            }
            //更新导航
            makeNav.refresh(root2 + 'library/');
            break;
        //更新 wiki
        case 'update':
        case '-u':
            if (!root) {
                console.error('非amWiki项目文件夹，无法更新导航！');
                break;
            }
            const type = parameters[0];
            //更新导航
            if (type === 'nav') {
                makeNav.refresh(root);
            }
            //更新文库嵌入数据
            else if (type === 'embed') {
            }
            //更新 SEO 模块
            else if (type === 'seo') {
            }
            //完整更新
            else if (typeof type === 'undefined') {
                makeNav.refresh(root);
            }
            break;
        //启动本地服务器
        case 'server':
        case '-s':
            if (!root) {
                console.error('非amWiki项目文件夹，无法启动服务器！');
                break;
            }
            mngWiki.linkWikis(wikis);
            mngWiki.addWiki(root);
            const port = parameters[0];
            //有输入端口且合法
            if (typeof port !== 'undefined' && /^\d+$/.test(port)) {
                localServer.run(wikis, port);
            }
            //没输入端口号
            else {
                localServer.run(wikis);
            }
            break;
        //本地浏览文档
        case 'browser':
        case '-b':
            if (!root) {
                console.error('非amWiki项目文件夹，无法浏览文库！');
                break;
            }
            mngWiki.linkWikis(wikis);
            mngWiki.addWiki(root);
            const fileId = parameters[0];
            //未给出需要浏览的文档id
            if (typeof fileId === 'undefined') {
                yield localServer.browser(root + 'library/', wikis);
            }
            //有给出需要浏览的文档id
            else {
            }
            break;
        //导出 wiki
        case 'export':
        case '-e':
            if (!root) {
                console.error('非amWiki项目文件夹，无法导出！');
                break;
            }
            if (parameters[0] !== 'github-wiki') {
                console.error('除 github-wiki 外，目前不支持其他类型导出！');
                break;
            }
            let outPath = parameters[1];
            if (typeof outPath === 'undefined') {
                outPath = yield prompt2('请输入导出文件夹：');
            }
            outPath = outPath.replace(/\\/g, '/');
            yield exportGithub.export(root, outPath);
            break;
        //显示版本号
        case 'version':
        case '-v':
            printFn.ver(mainPath);
            break;
        //显示帮助
        case 'help':
        case '-h':
        default:
            printFn.help();
            break;

    }

    //关闭用户输入
    process.stdin.on('error', (e) => {
        if (e.code !== 'EPIPE' || e.syscall !== 'shutdown') {
            throw e;
        }
    });
    process.stdin.end();

}).catch((e) => {
    console.error(e);
});
