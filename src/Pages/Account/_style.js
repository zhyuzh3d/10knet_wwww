//公用样式表
const styles = theme => ({
    page: {
        position: 'absolute',
        padding: 0,
        margin: 0,
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        display: 'block',
    },
    appBar: {
        boxShadow: 'none',
    },
    title: {
        marginTop: theme.spacing.unit * 6,
        marginBottom: theme.spacing.unit * 2,
        width: '100%',
        textAlign: 'center',
    },
    titleTab: {
        width: 100,
        textAlign: 'center',
    },
    row: {
        width: 360,
        textAlign: 'center',
    },
    container: {
        margin: 0,
        padding: 0,
        width: 296,
        display: 'inline-block',
    },
    item: {
        padding: 0
    },
    textField: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
    },
    textFieldHalf: {
        width: '50%',
        marginTop: theme.spacing.unit * 3,
        paddingRight: '10%',
    },
    btnHalf: {
        marginTop: theme.spacing.unit * 4,
        width: '40%',
    },
    forgotPw: {
        marginTop: theme.spacing.unit * 2,
        marginBottom: theme.spacing.unit * -2,
        width: '100%',
        textAlign: 'right',
    },
    loginBtn: {
        marginTop: theme.spacing.unit * 6,
        width: '100%',
    },
    dialog: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
    },
    dialogBtn: {
        width: 120,
        margin: theme.spacing.unit,
        marginBottom: theme.spacing.unit * 2,
    },
    imid: {
        display: 'inline-block',
    },
    vline: {
        display: 'inline-block',
        width: 1,
        height: '100%',
        background: '#AAA',
    },
    avatarLarge: {
        width: 200,
        height: 200,
        borderRadius: 200,
    }
});
export default styles;
