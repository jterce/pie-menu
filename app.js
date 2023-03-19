const electron = require("electron");
const globalShortcut = electron.globalShortcut;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const path = require("path");
const url = require("url");
const ioHook = require("iohook");
const child = require('child_process').execFile;

let win;
let tray;

function createWindow() {

  win = new BrowserWindow({
    width: 420,
    height: 420,
    show: true,
    frame: false,
    fullscreenable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });
  win.setResizable(false);
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file',
    slashes: true
  }));

  win.on('closed', () => {
    win = null;
  })

  win.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) {
      win.hide();
    }
  });	
}

ioHook.start();
app.whenReady().then(() => {
  globalShortcut.register('Alt+CommandOrControl+I', () => {
    toggleWindow();
  })
})

function toggleWindow() {
  win.isVisible() ? win.hide() : showWindow();
}

const showWindow = () => {
  const position = getWindowPosition();
  win.setPosition(position.x, position.y, false);
  win.show();
}

function getWindowPosition() {
  const windowBounds = win.getBounds();
  const pos = electron.screen.getCursorScreenPoint();
  return {x: Math.round(pos.x - windowBounds.width / 2), y: Math.round(pos.y - windowBounds.height / 2)}
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'favicon.png'));
  let menu = electron.Menu.getApplicationMenu();
  tray.setContextMenu(menu);
  tray.on('click', function (event) {
    toggleWindow();
  });
}

function mouseMoveHandler(event) {
  if (!win.isVisible()) return;

  const scale = electron.screen.getDisplayNearestPoint(event).scaleFactor;
  const mouse_x = event.x / scale;
  const mouse_y = event.y / scale;
  const bounds = win.getBounds();
  if (
    mouse_x < bounds.x 
    || mouse_x > bounds.x + bounds.width 
    || mouse_y < bounds.y 
    || mouse_y > bounds.y + bounds.height
  ) {
    win.hide();
  }
}

app.on('ready', () => {createWindow(), createTray(), ioHook.on("mousemove", event => mouseMoveHandler(event))});
app.on("window-all-closed", () => {
  ioHook.unregisterAllShortcuts();
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

function run(filepath) {
  child(filepath, function(err, data) {
    if(err){
      console.error(err);
      return;
    }
    console.log(data.toString());
  });
}
exports.run = run;