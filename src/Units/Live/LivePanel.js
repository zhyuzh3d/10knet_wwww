/*
直播面板，创建直播间或加入直播间
props:{
    roomId,如果没有指定那么只能等待手工创建
    open,
    style,
    roomId,
}
*/
import { Component } from 'react';
import h from 'react-hyperscript';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import FontA from 'react-fa';

import LiveVideo from '../../Units/Live/LiveVideo';
import LiveRoom from '../../Units/Live/LiveRoom';
import LiveBoard from '../../Units/Live/LiveBoard';
import UserButton from '../../Units/User/UserButton';


const style = theme => ({
    panelBox: {
        padding: 0,
        margin: 0,
        width: '100%',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        height: '100%',
    },
    btnBar: {
        width: '100%',
        padding: 0,
        margin: 0,
        height: 48,
        borderBottom: '1px solid #EEE',
        background: '#F5F5F5',
    },
    btn: {
        margin: 0,
        padding: 0,
        height: 48,
        borderRight: '1px solid #EEE',
        minWidth: 56,
        cursor: 'pointer',
        background: '#FFF',
    },
    btn2: {
        margin: 0,
        padding: 0,
        height: 48,
        borderLeft: '1px solid #EEE',
        minWidth: 56,
        cursor: 'pointer',
        background: '#FFF',
        float:'right',
    },
    inviteName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    invitePs: {
        fontSize: 12,
        fontWeight: 200,
    },
    boardPanel: {
        margin: 0,
        padding: '0px 8px',
        flexGrow: 1,
    },
});

//元件
global.$live = {};
class com extends Component {
    state = {
        roomInfo: null, //读取iroom数据库的info
        wdRefArr: [], //所有需要取消的野狗监听
        hasNewInvite: 0, //是否有新的邀请
        liveInviteArr: [], //收到的所有邀请
        useRoom: true, //是否使用视频模块
        useLiveCode: false, //是否使用同步代码模块
    };

    //初始化邀请提示
    componentDidMount = async function() {
        let that = this;
        this.wdAuthListen = global.$wd.auth().onAuthStateChanged(function(user) {
            var cuser = global.$wd.auth().currentUser;
            if(!cuser) return;

            //读取自己收到的邀请，如果有新的则红色显示30秒
            let ref = global.$wd.sync().ref(`uinvite/${cuser.uid}`);
            that.state.wdRefArr.push(ref);
            let nows = new Date().getTime();
            nows -= 600000; //10分钟之内
            ref.orderByChild('ts').startAt(nows).limitToLast(6).on('child_added', (shot) => {
                let arr = that.state.liveInviteArr;
                arr.push(shot.val());
                arr.sort((a, b) => { return b.ts - a.ts > 0 });
                that.setState({ liveInviteArr: arr, hasNewInvite: 31 });
            });

            //红色提示显示
            setInterval(() => {
                that.setState({ hasNewInvite: that.state.hasNewInvite - 1 });
            }, 1000);
        });
    };

    componentWillUnmount = () => {
        this.wdAuthListen && this.wdAuthListen();
        this.state.wdRefArr.forEach((item) => {
            item.off();
        });
    };

    //创建直播教室,默认自己主持，操作数据库iroom
    setRoom = global.$live.setRoom = (roomId) => {
        let that = this;
        let cuser = global.$wd.auth().currentUser;
        if(!cuser) {
            global.$alert.fn.show('请您先登录', '创建房间功能仅提供给已登录用户使用');
            return;
        };

        if(!roomId && that.props.roomId === 0) {
            //需要创建新房间
            global.$wd.sync().ref(`iroom`).push({
                author: cuser.uid,
                chairMan: cuser.uid,
                ts: global.$wd.sync().ServerValue.TIMESTAMP,
            }).then(function(newRef) {
                let id = newRef.key();
                newRef.on('value', (shot) => {
                    let info = Object.assign({ roomId: id }, shot.val());
                    that.setState({ roomInfo: info });
                });
            });
        } else {
            //读取已有房间并加入
            let id = roomId || that.props.roomId;
            global.$wd.sync().ref(`iroom/${id}`).on('value', (shot) => {
                let info = Object.assign({ roomId: id }, shot.val());
                that.setState({ roomInfo: info });
            });
        }
    };


    //弹窗显示当前在线的人员列表，使用selector
    showInviteDiaolog = () => {
        let that = this;
        let nows = new Date().getTime();
        nows -= 300000; //5分钟之前

        let ref = global.$wd.sync().ref('ucheck')
        let query = ref.orderByChild('ts').startAt(nows).limitToLast(6);
        query.once('value', (shot) => {
            let liveUserArr = shot.val();
            let itemArr = [];
            for(let key in liveUserArr) {
                itemArr.push({
                    uid: key,
                    el: h(UserButton, {
                        userId: key,
                        size: 'md',
                        asButton: false,
                    }),
                });
            };

            global.$selector.fn.show({
                title: `为您推荐了${itemArr.length}位在线对象`,
                itemArr: itemArr,
                labelKey: 'el',
                okHandler: (item) => {
                    global.$confirm.fn.show({
                        title: '请输入邀请附言',
                        input: {
                            tip: '邀请附言不多于32字符',
                            regx: /^[\S\s]{0,32}$/,
                            value: '',
                        },
                        okHandler: (iptVal) => {
                            that.inviteUser(item.uid, iptVal);
                        },
                        cancelHandler: (iptVal) => {
                            that.inviteUser(item.uid, iptVal);
                        },
                    });
                },
            });
        });
    };

    //邀请某人，向liveInvite／uid字段push新对象
    inviteUser = (uid, tip) => {
        let that = this;
        if(!that.state.roomInfo) return;
        if(!global.$wd.auth().currentUser) return;

        global.$wd.sync().ref(`uinvite/${uid}`).push({
            from: global.$wd.auth().currentUser.uid,
            fromName: global.$currentUser.displayName || '未命名用户',
            ts: global.$wd.sync().ServerValue.TIMESTAMP,
            ps: tip || 'TA什么也没说...',
            roomId: that.state.roomInfo.roomId,
        });
    };

    //显示我的邀请列表,去除新消息闪烁，点击加入邀请的房间
    showMyInviteDiaolog = () => {
        let that = this;
        const css = that.props.classes;
        let itemArr = that.state.liveInviteArr;

        that.setState({ hasNewInvite: 0 });

        itemArr.forEach((item, index) => {
            item.el = [
                h('div', {
                    className: css.inviteName
                }, h(UserButton, {
                    userId: item.from,
                    size: 'md',
                    asButton: false,
                })),
                h('div', { className: css.invitePs }, `  ${item.ps}`),
            ];
        });

        global.$selector.fn.show({
            title: `最近10分钟您收到的直播邀请`,
            itemArr: itemArr,
            labelKey: 'el',
            okHandler: (item) => {
                that.leaveRoom();
                that.setRoom(item.roomId);
                that.setState({ settingRoom: true });
                setTimeout(() => {
                    that.setState({ settingRoom: false });
                }, 3000);
            },
        });
    };

    //离开房间，停用room，livecode等
    leaveRoom = global.$live.leaveRoom = () => {
        let that = this;
        global.$confirm.fn.show({
            title: '您即将离开房间',
            text: '退出后无法返回，除非再次收到此房间人员的邀请',
            okHandler: () => {
                that.setState({
                    roomInfo: null,
                    useLiveCode: false,
                    useRoom: false,
                });
            },
        });
    };

    render() {
        let that = this;
        const css = that.props.classes;

        let roomInfo = that.state.roomInfo;

        //开启或退出按钮
        let exitBtn = h(Button, {
            className: css.btn,
            onClick: () => {
                that.leaveRoom();
            },
        }, [
           h(FontA, {
                name: 'close',
            }),
        ]);
        let startBtn = h(Button, {
            className: css.btn,
            onClick: () => {
                that.setRoom();
                that.setState({ settingRoom: true });
                setTimeout(() => {
                    that.setState({ settingRoom: false });
                }, 3000);
            },
            disabled: that.state.settingRoom,
        }, [
           h(FontA, {
                name: 'flash',
            })
        ]);

        //弹窗发起邀请按钮
        let inviteBtn = h(Button, {
            className: css.btn,
            onClick: () => {
                that.showInviteDiaolog();
            },
            disabled: !that.state.roomInfo,
        }, [
           h(FontA, {
                name: 'user-circle-o',
            }),
        ]);

        //显示我的邀请函按钮
        let myInviteBtn = h(Button, {
            className: css.btn,
            style: {
                background: that.state.hasNewInvite % 2 <= 0 ? '#FFF' : '#f50057',
                color: that.state.hasNewInvite % 2 <= 0 ? (that.state.liveInviteArr.length < 1 ? '#AAA' : 'inherit') : '#FFF',
            },
            onClick: () => {
                that.showMyInviteDiaolog();
            },
            disabled: !that.state.liveInviteArr.length > 0,
        }, [
           h(FontA, {
                name: 'vcard-o',
            }),
        ]);

        //使用代码模块按钮
        let liveCodeBtn = h(Button, {
            className: css.btn2,
            style: {
                background: 'inherit',
                color: that.state.useLiveCode ? '#f50057' : '#AAA',
            },
            onClick: () => {
                that.setState({ useLiveCode: !that.state.useLiveCode });
            },
        }, [
           h(FontA, {
                name: 'code',
            }),
        ]);

        //使用直播视频模块按钮
        let liveRoomBtn = h(Button, {
            className: css.btn2,
            style: {
                background: 'inherit',
                color: that.state.useLiveCode ? '#f50057' : '#AAA',
            },
            onClick: () => {
                that.setState({ useLiveRoom: !that.state.useLiveRoom });
            },
        }, [
           h(FontA, {
                name: 'youtube-play',
            }),
        ]);

        return that.props.open ? h(Grid, {
            container: true,
            className: css.panelBox,
        }, [
            roomInfo && that.state.useLiveRoom ? h(LiveRoom, {
                roomId: roomInfo.roomId,
            }) : undefined,

            h('div', {
                className: css.btnBar,
            }, [
                roomInfo ? exitBtn : startBtn,
                inviteBtn,
                myInviteBtn,
                liveCodeBtn,
                liveRoomBtn,
            ]),

            roomInfo && that.state.useLiveCode ? h(Grid, {
                container: true,
                className: css.boardPanel,
            }, h(LiveBoard, {
                roomInfo: that.state.roomInfo,
            })) : null,
        ]) : null;
    };
};



com.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(style)(com);
