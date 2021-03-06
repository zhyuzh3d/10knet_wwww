/*
APP入口，
根据url路径的pageName载入页面
根据url路径的useSlavePart或global.$electron判读是否使用左侧部分
*/

import { Component } from 'react';
import wilddog from 'wilddog';
import h from 'react-hyperscript';
import PropTypes from 'prop-types';
import { MuiThemeProvider, withStyles } from 'material-ui/styles';
import urlParser from 'urlparser';
import merge from 'deepmerge';


import Theme from './Theme'; //主题风格
import Conf from './Conf'; //全局设置
import Pages from './Pages'; //全局设置

import MyFn from '../Utils/MyFn'; //统一的确认弹窗
import MyRouter from '../Utils/MyRouter'; //全局页面路由
import MyStore from '../Utils/MyStore'; //全局页面路由
import MySnackbar from '../Utils/MySnackbar'; //底部统一的提示
import MyAlert from '../Utils/MyAlert'; //统一的警告弹窗
import MyConfirm from '../Utils/MyConfirm'; //统一的确认弹窗
import MySelector from '../Utils/MySelector'; //统一的选择弹窗
import MyIpc from '../Utils/MyIpc'; //electron窗口进程通信ipc处理

import Grid from 'material-ui/Grid';
import style from './_style';

import LivePanel from '../Units/Live/LivePanel';

const theAppTitle = '10knet.com - 拾课网客户端 - 00.00.01';

//全局使用
global.$fn = MyFn;
global.$router = MyRouter;
global.$store = MyStore.store;
global.$alert = MyAlert;
global.$confirm = MyConfirm;
global.$selector = MySelector;
global.$snackbar = MySnackbar;
global.$ipc = MyIpc;

//野狗账号与数据存储
global.$conf = Conf;
global.$wd = wilddog;
global.$wd.video = window.$wilddogVideo;
global.$wd.initializeApp(global.$conf.wd);
global.$app = {};

//所有公用函数
global.$xdata = {}; //穿越

console.log('>>zhyuzh制作 || QQ 286052520 如有BUG或建议欢迎联络交流！<<\n--感谢野狗（wilddog.com)大力支持--')

//App元素
class App extends Component {
    state = {
        currentPage: 'div',
        currentUser: null,
        mainVis: false,
        liveVis: true,
        liveHei: 128,
        viewerHei: window.innerHeight - 128,
        viewerUrl: 'http://www.10knet.com',
        useSlavePart: false, //是否使用实时面板
    };

    //初始化ipc窗口和msg监听,根据地址栏确定是否显示实时部分
    componentWillMount = () => {
        let that = this;
        if(global.$ipc) {
            global.$ipc.init(global.$winName);
        };
        let urlObj = urlParser.parse(window.location.href);
        let useSlavePart = urlObj.query ? urlObj.query.params['useSlavePart'] : undefined;
        that.setState({ useSlavePart: useSlavePart });
    };

    //每分钟自动记录一次登录状态
    userCheckTimer = false;
    startAutoCheck = global.$app.startAutoCheck = (uid) => {
        let that = this;
        that.userCheckTimer && clearInterval(that.userCheckTimer);
        setInterval(() => {
            that.userCheck(uid);
        }, 60000);
    };

    //签到一次
    userCheck = global.$app.userCheck = (uid) => {
        global.$wd.sync().ref(`ucheck`).update({
            [uid]: { ts: global.$wd.sync().ServerValue.TIMESTAMP },
        }).catch((err) => {
            console.log(`[APP/userCheck]:${err}`);
        });

        global.$wd.sync().ref(`uchecks/${uid}`).transaction(function(cv) {
            return(cv || 0) + 1;
        }).catch((err) => {
            console.log(`[APP/userCheck]:${err}`);
        });
    };

    //初始化页面，自动根据地址栏路径判断切换到首页
    componentDidMount = async function() {
        let that = this;
        global.$router.init(this, Pages);
        let urlObj = urlParser.parse(window.location.href);
        let pName = urlObj.path ? urlObj.path.base : 'MainHomePage';
        let urlPname = urlObj.query ? urlObj.query.params['pageName'] : undefined;
        pName = urlPname ? urlPname : pName;

        global.$router.changePage(pName, { currentUser: this.state.currentUser });

        //自适应viewer高度
        window.addEventListener('resize', () => {
            that.setState({ viewerHei: window.innerHeight - 97 });
        });

        //野狗自动登录，自动定时签到
        global.$currentUser = global.$wd.auth().currentUser;
        this.wdAuthListen = global.$wd.auth().onAuthStateChanged(function(user) {
            var cuser = global.$wd.auth().currentUser;
            clearInterval(that.userCheckTimer);
            if(cuser) {
                that.userCheck(cuser.uid);
                that.startAutoCheck(cuser.uid);

                //合并user字段数据
                global.$wd.sync().ref(`user/${cuser.uid}`).once('value', (shot) => {
                    cuser = merge(cuser, shot.val() || {});
                    that.setState({ currentUser: cuser });
                    global.$currentUser = cuser;
                });
            } else {
                that.toggleMainPart(true);
                global.$router.changePage('LoginPage', {
                    successPage: 'MainHomePage',
                });
            };
        });
    };

    xset = global.$app.xset = (obj) => {
        this.setState(obj);
    };

    //全局使用打开右侧面板
    toggleMainPart = global.$app.toggleMainPart = (toggle) => {
        if(toggle === undefined) toggle = !this.state.mainVis;
        this.setState({ mainVis: toggle });
        global.$live.setMainState(toggle);
    };

    //渲染实现
    render() {
        let that = this;
        document.getElementsByTagName('title')[0].innerHTML = theAppTitle;
        const css = this.props.classes;

        //let useSlavePart = global.$electron || that.state.useSlavePart ? true : false;
        let useSlavePart = true;

        //可折叠右侧资源栏360宽
        let mainPart = h(Grid, {
            item: true,
            className: useSlavePart ? css.mainPart : css.mainPartFull,
            style: { display: that.state.mainVis ? 'flex' : 'none' },
        }, [
            h(that.state.currentPage),
            h(MySnackbar),
            h(MyAlert),
            h(MyConfirm),
            h(MySelector),
        ]);

        let slavePart;
        if(useSlavePart) {
            slavePart = h(Grid, {
                item: true,
                className: css.slavePart,
            }, h(Grid, {
                container: true,
                className: css.slaveBox,
            }, [
            that.state.liveVis ? h(Grid, {
                    item: true,
                    style: {
                        margin: 0,
                        padding: 0,
                    },
                    className: css.live,
                    onClick: () => {
                        if(that.state.mainVis) {
                            that.toggleMainPart(false);
                        };
                    },
                }, h(LivePanel, {
                    open: true,
                    roomId: 0,
                })) : null,
            ]));
        };

        //最终拼合
        return h(MuiThemeProvider, {
            theme: Theme,
        }, h(Grid, {
            container: true,
            spacing: 0,
            className: css.partsContainer,
        }, [
            mainPart,
            slavePart,
        ]));
    };
};

App.propTypes = {
    classes: PropTypes.object.isRequired,
};


export default withStyles(style)(App);
