/*
单个帖子组件ListItem
props:{
    post:标准的单条post数据，author不需要展开
}
*/
import { Component } from 'react';
import h from 'react-hyperscript';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import Moment from 'react-moment';

import UserButton from '../../Units/User/UserButton';

const style = theme => ({
    post: {
        borderBottom: '1px solid #EEE',
        padding: 0,
        margin: 0,
        paddingBottom: 8,
    },
    infoLine: {
        paddingBottom: 0,
        marginBottom: 4,
        height: 28,
    },
    txtLine: {
        fontSize: '0.9rem',
        color: '#333',
    },
    urlLine: {
        position: 'relative',
    },
    img: {
        maxHeight: 100,
        cursor: 'pointer',
    },
    link: {
        fontSize: '0.6rem',
        cursor: 'pointer',
        padding: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        textAlign: 'left',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    linkBtn: {
        padding: '0 8px',
        margin: -8,
        maxWidth: '80%',
    },
    time: {
        fontSize: '10px',
        color: '#AAA',
        verticalAlign: 'middle',
        fontWeight: 200,
    },
});

//元件
class com extends Component {
    state = {
        post: {},
    };

    componentDidMount = async function() {
        //获取用户信息
    };
    render() {
        let that = this;
        const css = that.props.classes;
        let post = that.props.post || {};
        let regx = global.$conf.regx;

        return h(Grid, { container: true, className: css.post }, [
            h(Grid, {
                item: true,
                xs: 12,
                className: css.infoLine,
                style: {
                    padding: '8px 40px 8px 40px',
                }
            }, [
                h(UserButton, { userId: post ? post.author : null }),
                h(Moment, {
                    className: css.time,
                    format: 'YYYY-MM-DD hh:mm:ss'
                }, post.ts),
            ]),
            h(Grid, {
                item: true,
                xs: 12,
                className: css.txtLine,
                style: {
                    padding: '4px 40px',
                }
            }, [
                h('div', {}, post.text || '他什么也没写...'),
            ]),
            post.url ? h(Grid, {
                item: true,
                xs: 12,
                className: css.urlLine,
                style: {
                    padding: '4px 40px',
                    marginBottom: -4,
                }
            }, [
                h('a', {
                    target: '_blank',
                    href: post.url,
                }, [
                    !regx.postUrl.test(post.url) ? h('img', {
                        className: css.img,
                        src: post.url,
                    }) : h(Button, {
                        color: 'primary',
                        className: css.linkBtn,
                        style: {
                            margin: '8px 0',
                        }
                    }, [
                        h('span', {
                            className: css.link,
                        }, `附件 : ${post.url}`),
                    ]),
                ])
            ]) : undefined,
        ]);
    }
};


com.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(style)(com);
