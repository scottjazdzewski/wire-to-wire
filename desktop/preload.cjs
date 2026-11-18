'use strict';
// Minimal capability announcement, no Node/file-system access granted to game UI.
const {contextBridge}=require('electron');
const smokeMode=process.argv.some(argument=>argument.startsWith('--wtw-smoke='))||
 Boolean(process.env.WTW_SMOKE_PHASE);
contextBridge.exposeInMainWorld('WTWDesktop',Object.freeze({
 runtime:'windows-desktop',
 bridgeVersion:1,
 offlineBundle:true,
 smokeMode
}));
