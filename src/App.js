import React, { Component } from 'react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import './App.css';
import theme from "./components/material-ui/theme";

import Login from "./containers/Login/Login";
import Home from "./components/Home/Home";
import Lobby from "./containers/Lobby/Lobby";
import GameLobby from "./containers/GameLobby/GameLobby";
// import EndPage from "./components/EndPage/EndPage";
import AvatarSelection from "./containers/AvatarSelection/AvatarSelection";
import Playing from "./containers/Playing/Playing";
import { SocketProvider } from "./context/SocketContext/SocketContext";
import { AuthProvider } from "./context/AuthContext/AuthContext";


class App extends Component {
    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <SocketProvider>
                    <AuthProvider>
                        <Playing/>
                        {/* <BrowserRouter>
                            <Switch>
                                <Route path="/avatar" component={AvatarSelection}/>
                                <Route path="/home" component={Home}/>
                                <Route path="/lobby" component={Lobby}/>
                                <Route path="/game/:id" component={GameLobby}/> */}
                                {/* <Route path="/" component={EndPage}/> This Page might be integrated into /game/:id */}
                                {/* <Route path="/" component={Playing}/> This Page might be integrated into /game/:id */}
                                {/* <Route path="/" component={Login}/>
                            </Switch>
                        </BrowserRouter> */}
                    </AuthProvider>
                </SocketProvider>
            </MuiThemeProvider>
        );
    }
}

export default App;
