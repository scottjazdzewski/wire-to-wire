'use strict';
// Minimal capability announcement, no Node/file-system access granted to game UI.
const {contextBridge}=require('electron');
contextBridge.exposeInMainWorld('WTWDesktop',Object.freeze({
 runtime:'windows-desktop',
 bridgeVersion:1,
 offlineBundle:true
}));
