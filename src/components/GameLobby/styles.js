const styles = theme => ({
    title: {
        textAlign: "center",
        fontSize: "3em",
        paddingTop: "20px",
        paddingBottom : "30px",
        color: theme.palette.primary.contrastText,
        fontFamily: theme.fonts.fancy
    },
    lobby: {
        height: "100vh",
        backgroundColor: theme.palette.primary.main,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    paper: {
        maxHeight: "calc(100vh - 126px)",
        width: "calc(100vw - 40px)",
        overflowY: "auto"
    },
    buttons: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        alignItems: "flex-end",
        padding: "10px",
        margin: "auto",
    },
    button: {
        width: "200px",
        margin:"10px",
        fontSize: "1.5em",
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.contrastText,
        textTransform: "capitalize",
        fontFamily: theme.fonts.simple,
        alignSelf: "flex-end",
        "&:hover": {
            backgroundColor: theme.palette.primary.contrastText
        }
    },
    grow: {
        flexGrow: 1
    }
    
});

export default styles;
