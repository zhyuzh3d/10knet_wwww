import { Component } from 'react';
import wilddog from 'wilddog';
import h from 'react-hyperscript';
import { MuiThemeProvider } from 'material-ui/styles';
import urlParser from 'urlparser';

import Theme from './Theme'; //主题风格
import Conf from './Conf'; //全局设置
import Pages from './Pages'; //全局设置

import MyRouter from '../Utils/MyRouter'; //全局页面路由
import MyStore from '../Utils/MyStore'; //全局页面路由
import MySnackbar from '../Utils/MySnackbar'; //底部统一的提示
import MyAlert from '../Utils/MyAlert'; //统一的警告弹窗
import MyConfirm from '../Utils/MyConfirm'; //统一的确认弹窗

//全局使用
global.$router = MyRouter;
global.$store = MyStore.store;
global.$storeRemove = MyStore.storeRemove;
global.$alert = MyAlert;
global.$confirm = MyConfirm;
global.$snackbar = MySnackbar;

//野狗账号与数据存储
global.$conf = Conf;
global.$wd = wilddog;
global.$wd.initializeApp(global.$conf.wd);

//所有公用函数
global.$fn = {};
global.$xdata = {}; //穿越

//App元素
class App extends Component {
    state = {
        currentPage: 'div',
    };

    //初始化页面，自动根据地址栏路径判断切换到首页
    componentDidMount = async function() {
        global.$router.init(this, Pages);
        var urlObj = urlParser.parse(window.location.href);
        var pName = urlObj.path ? urlObj.path.base : '/MainHomePage';
        global.$router.changePage(pName);
    };

    //渲染实现
    render() {
        let that = this;
        return h(MuiThemeProvider, {
            theme: Theme,
        }, h('div', [
            h(that.state.currentPage),
            h(MySnackbar),
            h(MyAlert),
            h(MyConfirm),
        ]));
    };
};

export default App;
