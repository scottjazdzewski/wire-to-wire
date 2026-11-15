'use strict';
// Narrow desktop capabilities; no Node/file-system access reaches the game UI.
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('WTWDesktop',Object.freeze({
 runtime:'windows-desktop',
 bridgeVersion:1,
 offlineBundle:true,
 careers:Object.freeze({
  list:()=>ipcRenderer.invoke('wtw-careers:list'),
  get:id=>ipcRenderer.invoke('wtw-careers:get',id),
  put:(meta,record)=>ipcRenderer.invoke('wtw-careers:put',meta,record),
  remove:id=>ipcRenderer.invoke('wtw-careers:remove',id)
 })
}));
