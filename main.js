var app = require('app');

var Menu = require('menu');
var Tray = require('tray');
var BrowserWindow = require('browser-window');
require('shelljs/global');

var appIcon = null,
    toggle = true,
    about = null,
    settingsBackup = {},
    getters = [
      { cmd: 'gsettings get org.gnome.settings-daemon.plugins.power idle-dim', variable: "dimmer" },
      { cmd: 'gsettings get org.gnome.desktop.session idle-delay', variable: "dimmer_delay"},
      { cmd: 'gsettings get org.gnome.desktop.screensaver lock-enabled', variable: "locked"},
      { cmd: 'gsettings get org.gnome.desktop.screensaver idle-activation-enabled', variable: "screensaver" }
    ],
    setters = [
      { cmd: 'gsettings set org.gnome.settings-daemon.plugins.power idle-dim', variable: "false" },
      { cmd: 'gsettings set org.gnome.desktop.session idle-delay', variable: "0" },
      { cmd: 'gsettings set org.gnome.desktop.screensaver lock-enabled', variable: "false" },
      { cmd: 'gsettings set org.gnome.desktop.screensaver idle-activation-enabled', variable: "false" }
    ];
var actions = {
  disabled: {
    label: 'Screensaving disabled!'
  },
  disable: {
    label: 'Block Screensaving',
    click: function() {
      for (var i = 0; i < getters.length; i++) {
        (function (cmd, variable) {
          setSettings(cmd, variable);
        })(setters[i].cmd, setters[i].variable);
      }
      appIcon.setImage('./icon_inverted.png');
      toggle = !toggle;
      appIcon.setContextMenu(Menu.buildFromTemplate(createContextMenu()));
    }
  },
  enable: {
    label: 'Unblock Screensaving',
    click: function () {
      reset();
      appIcon.setImage('./icon.png');
      toggle = !toggle;
      appIcon.setContextMenu(Menu.buildFromTemplate(createContextMenu()));
    }
  },
  separator: {
    type: "separator"
  },
  about: {
    label: 'About',
    click: function () {
      about = new BrowserWindow({
        width: 400,
        height: 400,
        icon: 'icon.png',
        'skip-taskbar': true,
        type: 'notification'
      });
      about.loadUrl('file://' + __dirname + '/about.html');
      about.on('closed', function () {
        about = null;
      })
      app.on('window-all-closed', function() {
        ;
      });
    }
  },
  quit: {
    label: 'Quit',
    click: function () {
      reset();
      app.quit();
    }
  }
}

var createContextMenu = function () {
  if (toggle) {
    return [actions.disable, actions.separator, actions.about, actions.quit];
  } else {
    return [actions.enable, actions.separator, actions.about, actions.quit];
  }
}

var getSettings = function (cmd, variable) {
  exec(cmd, { silent: true, async: true }, function (code, output) {
    if (code === 0) {
      var o = output.split(" ");
      o = o[o.length - 1];
      settingsBackup[variable] = o;
    }
  });
}

var setSettings = function (cmd, variable) {
  echo ("set: " + cmd + " " + variable);
  exec(cmd + ' ' + variable, { silent: true, async: true }, function (code, output) { ; });
}

var reset = function () {
  for (var i = 0; i < getters.length; i++) {
    (function (cmd, variable) {
      setSettings(cmd, settingsBackup[variable]);
    })(setters[i].cmd, getters[i].variable);
  }
}

app.on('ready', function() {
  for (var i = 0; i < getters.length; i++) {
    (function (cmd, variable) {
      getSettings(cmd, variable);
    })(getters[i].cmd, getters[i].variable);
  }

  appIcon = new Tray('./icon.png');

  appIcon.setToolTip('Block Screen- & Energysaver');
  appIcon.setContextMenu(Menu.buildFromTemplate(createContextMenu()));
});
