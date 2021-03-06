/*
共用编辑器界面，代码、设置、动作都指向同一个路径
props:{
    wdRef,同步设置的路径,未指定路径时候整个编辑器禁用
    roomId,聊天室同步id，可以包含在wdRef中，这里只是方便使用
    onChair,是否主持当前代码编写
    public:{toggleOJ(),},输出控制OJ开关的函数
    setShowOJ(bool),设置外面的showOJ状态
}
*/

import { Component } from 'react';
import h from 'react-hyperscript';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import FontA from 'react-fa';


import MyCoder from '../../Utils/MyCoder';
import OJlist from '../../Units/OJ/OJlist';
import OJdetails from '../../Units/OJ/OJdetails';


const style = theme => ({
    comBox: {
        margin: 0,
        padding: 0,
        position: 'relative',
    },
    coderBox: {
        position: 'relative',
        height: '100%',
        width: '40%',
    },
    OJbox: {
        position: 'relative',
        width: '60%',
    },
    OJbtn: {
        position: 'absolute',
        right: 0,
        top: 0,
        minWidth: 24,
        minHeight: 24,
        height: 32,
        width: 36,
        zIndex: 10,
    }
});

//元件
class com extends Component {
    state = {
        value: '',
        editorPublic: {}, //用来放置子编辑器传递出来的函数
        editorMode: 'text/x-c++src',
        OJpage: 'list', //显示OJ的页面
        OJid: null, //OJ详细页面的ID，
        lastOJpage: 'list', //上一个OJ页面，用于开关按钮恢复
        showOJ: true,
    };

    wdRefArr = [];
    componentWillMount = async function() {
        if(this.props.public) {
            this.props.public.toggleOJ = this.toggleOJ;
        }
        if(this.props.onChair || !this.props.roomId) {
            this.stopSync();
            this.getStore();
            this.setState({ showOJ: this.state.showOJ });
        } else {
            this.startSync();
        };
        this.setShowOJ && this.setShowOJ(this.state.showOJ);
    };

    //尝试从本地存储自动恢复数据
    getStore = () => {
        this.setState(global.$store('LiveCoder', null) || {});
    };

    //保存到本地数据以便恢复
    saveStore = () => {
        global.$store('LiveCoder', this.setStore(this.state));
    };

    //设置store存储与恢复，只有这里的字段会被恢复
    setStore = (obj) => {
        return {
            value: obj.value,
            editorMode: obj.editorMode,
            OJpage: obj.OJpage,
            OJid: obj.OJid,
            lastOJpage: obj.lastOJpage,
            showOJ: obj.showOJ,
        }
    };


    //切换onChair的时候调整
    oldProps = {};
    componentWillReceiveProps = (newProps) => {
        let that = this;
        newProps = newProps || {};
        let changeRoom = newProps.roomId !== that.oldProps.roomId; //换房间
        let changeChair = newProps.onChair !== that.oldProps.onChair; //换主持
        if(changeRoom || changeChair) {
            if(that.oldProps.wdRef) { //停止旧的监听
                global.$wd.sync().ref(that.oldProps.wdRef).off();
            };
            that.oldProps = newProps ? { //更新oldProps
                roomId: newProps.roomId,
                onChair: newProps.onChair,
            } : {};

            if(!newProps.onChair && newProps.roomId) {
                that.startSync(newProps); //开启新的监听
            } else {
                //理解把代码推送到同步数据库
                let value = that.state.value || '';
                if(!newProps || !newProps.wdRef) return;
                global.$wd.sync().ref(`${newProps.wdRef}/value`).set(value);
                global.$wd.sync().ref(`${newProps.wdRef}/showOJ`).set(that.state.showOJ);
                that.stopSync(); //停止同步
            }
        };
    };

    hasUnmounted = false;
    componentWillUnmount = async function() {
        this.saveStore();
        this.stopSync();
        this.hasUnmounted = true;
    };

    //开始同步代码，同步oj页面类型
    startSync = (props) => {
        let that = this;
        props = props || that.props;

        if(!props.wdRef) return;
        let ref = global.$wd.sync().ref(props.wdRef);
        that.wdRefArr.push(ref);
        ref.on('value', (shot) => {
            let data = shot.val();
            let value = data ? data.value : null;
            let sel = data ? data.sel : null;

            let OJpage = data ? data.OJpage : 'list';
            let showOJ = data ? data.showOJ : true;
            if(!props.onChair || !props.roomId) {
                that.setState({ OJpage: OJpage });
                that.setState({ showOJ: showOJ });
                that.setShowOJ && that.setShowOJ(showOJ);
            };

            if(that.state.editorPublic) {
                let selObj = sel ? JSON.parse(sel) : {};
                that.setState({ value: value });
                that.state.editorPublic.setValue(value || '');
                that.state.editorPublic.setSelection(selObj || {});
            }
        });
    };

    //停止同步代码
    stopSync = () => {
        let that = this;
        global.$wd.sync().ref(`${that.props.wdRef}`).off();
    }

    //代码变化回调函数，没进房间直接设置value，其他同步到野狗数据库
    onChange = (editor, metadata, value) => {
        let that = this;
        if(!that.props.roomId || !that.onChair) {
            that.setState({ value: value });
            global.$store('LiveCoder', { value: value });
        };
        if(that.props.onChair) {
            global.$wd.sync().ref(`${that.props.wdRef}/value`).set(value);
        }
    }

    //选择变化回调函数，同步到野狗数据库，不叠加保存
    onSelection = (editor, data) => {
        let that = this;
        if(!that.props.roomId || !that.props.wdRef || !that.props.onChair) return;
        global.$wd.sync().ref(`${that.props.wdRef}/sel`).set(JSON.stringify(data));
    }

    onChair = false;

    //切换到显示详细信息页面，同步到ioj
    showOJdetails = global.$live.showOJdetails = (id) => {
        let that = this;
        that.setState({ OJpage: 'details' });
        global.$store('LiveCoder', { OJpage: 'details' });
        that.setState({ OJid: id });
        if(that.props.roomId) {
            global.$wd.sync().ref(`${that.props.wdRef}`).update({ OJpage: 'details' });
            global.$wd.sync().ref(`ioj/${that.props.wdRef}/details`).update({ id: id });
        }
    };

    //显示到OJ列表，page页码会由list内部自动同步到ioj
    showOJlist = () => {
        let that = this;
        this.setState({ OJpage: 'list' });
        global.$store('LiveCoder', { OJpage: 'list' });
        if(that.props.roomId) {
            global.$wd.sync().ref(`${that.props.wdRef}`).update({ OJpage: 'list' });
        }
    };

    //主持人打开和关闭OJ部分,同步控制访客
    toggleOJ = global.$live.toggleOJ = (toggle) => {
        let that = this;
        toggle = toggle === undefined ? !that.state.showOJ : toggle;
        if(!that.hasUnmounted) that.setState({ showOJ: toggle });
        if(that.props.roomId) {
            global.$wd.sync().ref(`${that.props.wdRef}/showOJ`).set(toggle);
        };
        return toggle;
    };



    //渲染实现
    render() {
        let that = this;
        const css = that.props.classes;
        let roomId = that.props.roomId;

        return h(Grid, {
            container: true,
            className: css.comBox,
        }, [
            h('div', {
                className: css.coderBox,
                style: {
                    width: that.state.showOJ ? '40%' : '100%',
                },
            }, h(MyCoder, {
                fontSize: 16,
                value: that.state.value,
                onChange: that.onChange,
                onSelection: that.onSelection,
                public: that.state.editorPublic,
                options: {
                    mode: that.state.editorMode,
                },
            })),
            h('div', {
                className: css.OJbox,
                style: {
                    display: that.state.showOJ ? 'block' : 'none',
                },
            }, [
                that.state.OJpage !== 'details' ? h(OJlist, {
                    showDetails: that.showOJdetails,
                    wdPath: roomId ? `ioj/${roomId}` : undefined,
                    onChair: that.props.onChair || !roomId,
                    roomId: roomId,
                }) : null,
                that.state.OJpage === 'details' ? h(OJdetails, {
                    wdPath: roomId ? `ioj/${roomId}` : undefined,
                    id: that.state.OJid,
                    code: that.state.value,
                    back: that.showOJlist,
                    onChair: that.props.onChair || !roomId,
                    roomId: roomId,
                }) : null,
            ]): null,
            false && (that.props.onChair || !roomId) ? h(Button, {
                className: css.OJbtn,
                raised: true,
                color: 'default',
                onClick: () => { that.toggleOJ() },
            }, h(FontA, {
                name: that.state.showOJ ? 'close' : 'balance-scale'
            })) : null,
        ]);


    };
};

com.propTypes = {
    classes: PropTypes.object.isRequired,
};



export default withStyles(style)(com);
