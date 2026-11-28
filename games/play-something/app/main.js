const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
function create() {
  const w = new BrowserWindow({
    width: 1100, height: 800, minWidth: 360, minHeight: 480,
    backgroundColor: '#0f1d3a', title: 'Games Hub', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, autoplayPolicy: 'no-user-gesture-required' }
  });
  w.loadFile(path.join(__dirname, 'www', 'index.html'));
  w.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  w.webContents.on('will-navigate', (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
}
Menu.setApplicationMenu(null);
app.whenReady().then(() => { create(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) create(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
