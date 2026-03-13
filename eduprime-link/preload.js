const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eduprime', {
    version: '2.0.0',
    name: 'EduPrime Link'
});

contextBridge.exposeInMainWorld('linkAPI', {
    reload: () => ipcRenderer.send('reload-window')
});
