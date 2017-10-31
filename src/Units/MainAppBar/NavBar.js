/*
导航专用顶部栏，包含左侧的返回按钮（返回上一页）和面包屑导航标题，右侧用户头像菜单
props:{
    title:导航栏显示的标题，默认 资源管理中心，可以是元素数组[]
}
*/
import { Component } from 'react';
import h from 'react-hyperscript';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import merge from 'deepmerge';

import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import ButtonBase from 'material-ui/ButtonBase';
import IconButton from 'material-ui/IconButton';
import FontA from 'react-fa';
import Typography from 'material-ui/Typography';

import UserMenu from '../../Units/User/UserMenu';


const style = theme => ({
    appBar: {
        position: 'relative',
        padding: 0,
        boxShadow: 'none',
        borderBottom: '1px solid #EEE',
        height: 48,
        minHeight: 48,
    },
    baseButton: {
        fontSize: '0.9rem',
    },
    dividerV: {
        marginRight: theme.spacing.unit * 2,
        marginLeft: theme.spacing.unit,
    },
    flex: {
        flex: 1,
        fontSize: '0.9rem',
    },
    title: {
        flex: 1,
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-all',
    }
});

//元件
class com extends Component {
    state = {
        snackbarText: '..tip..',
        snackbarOpen: false,
        hasLogin: false,
        title: '控制中心',
        currentUser: null,
    };


    //界面完成后的初始化函数:判断用户是否登录，创建userMenu
    wdAuthListen = null;
    componentDidMount = async function() {
        let that = this;
        this.wdAuthListen = global.$wd.auth().onAuthStateChanged(function(user) {
            var cuser = global.$wd.auth().currentUser;
            if(!cuser) return;
            let ref = global.$wd.sync().ref(`user/${cuser.uid}`)
            ref.once('value', (shot) => {
                cuser = merge(cuser, shot.val() || {});
                try {
                    that && that.setState({ currentUser: cuser });
                } catch(err) {}
            });
        });
    };

    componentWillUnmount = async function() {
        try {
            this.wdAuthListen && this.wdAuthListen();
        } catch(err) {};
    };

    //渲染实现
    render() {
        let that = this;
        const css = that.props.classes;
        const title = that.props.title || that.state.title;
        const winTitle = that.props.winTitle;
        if(winTitle) document.getElementsByTagName('title')[0].innerHTML = winTitle;

        //导航栏
        let topBar = h(AppBar, {
            color: 'default',
            className: css.appBar,
        }, [
            h(Toolbar, { className: css.appBar }, [
                h('div', {}, [
                    h(IconButton, {
                        onClick: (evt) => {
                            global.$router.prevPage();
                        }
                    }, h(FontA, { name: 'angle-left' })),
                    h(ButtonBase, {
                        className: css.baseButton,
                        onClick: (evt) => {
                            global.$router.changePage('MainHomePage');
                        }
                    }, '首页'),
                    h('span', { className: css.dividerV }, '|'),
                ]),
                h(Typography, { type: 'title', className: css.title }, title),
                h(UserMenu),
            ]),
        ]);

        return topBar;
    }
};


com.propTypes = {
    classes: PropTypes.object.isRequired,
};


export default withStyles(style)(com);
