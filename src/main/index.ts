import { app, shell, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/tray-icon.png?asset'

// Disable GPU cache to prevent disk cache errors on Windows
app.commandLine.appendSwitch('disable-gpu-cache')

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  // Get primary display work area for positioning
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // Window dimensions
  const windowWidth = 180
  const windowHeight = 200

  // Calculate position: bottom-right corner, sitting on taskbar
  const x = width - windowWidth - 20
  const y = height - windowHeight + 100

  // Create the browser window with floating widget configuration.
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    show: false,
    autoHideMenuBar: true,
    skipTaskbar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Make window click-through by default
    mainWindow?.setIgnoreMouseEvents(true, { forward: true })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  // Create tray icon from the tray-icon.png file
  const trayImage = nativeImage.createFromPath(trayIcon)
  const resizedIcon = trayImage.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show()
      }
    },
    {
      label: 'Hide',
      click: () => {
        mainWindow?.hide()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('ph App')
  tray.setContextMenu(contextMenu)

  // Double-click on tray icon to show window
  tray.on('double-click', () => {
    mainWindow?.show()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create system tray
  createTray()

  // IPC handler for setting mouse events ignore
  ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  // IPC handler for moving window horizontally only
  ipcMain.on('move-window', (_event, deltaX: number) => {
    if (mainWindow) {
      const currentPosition = mainWindow.getBounds()
      mainWindow.setPosition(currentPosition.x + deltaX, currentPosition.y)
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Keep app running when window is closed - tray menu still available
  // User can quit via tray menu or Cmd + Q on macOS
  if (process.platform !== 'darwin') {
    // Don't quit - keep app running for tray menu
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
