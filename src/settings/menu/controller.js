/** ****************************************************************************
 * Settings Menu controller.
 *****************************************************************************/
import Backbone from 'backbone';
import App from 'app';
import { Log, Analytics } from 'helpers';
import appModel from '../../common/models/app_model';
import userModel from '../../common/models/user_model';
import recordManager from '../../common/record_manager';
import MainView from './main_view';
import HeaderView from '../../common/views/header_view';

const API = {
  show() {
    Log('Settings:Menu:Controller: showing');

    const mainView = new MainView({
      model: appModel,
    });
    mainView.on('setting:toggled', (setting, on) => {
      Log('Settings:Menu:Controller: setting toggled');

      appModel.set(setting, on);
      appModel.save();
    });

    mainView.on('records:submit:all', API.sendAllRecords);
    mainView.on('records:delete:all', API.deleteAllRecords);
    mainView.on('app:reset', () => {
      App.regions.getRegion('dialog').show({
        title: 'Reset',
        class: 'error',
        body: 'Are you sure you want to clear all records from list?' +
        '</br>Choose this option if you want to start a new Plant Hunt list',
        buttons: [
          {
            title: 'Cancel',
            onClick() {
              App.regions.getRegion('dialog').hide();
            },
          },
          {
            title: 'Reset',
            class: 'btn-negative',
            onClick() {
              // delete all
              API.resetApp(() => {
                App.regions.getRegion('dialog').show({
                  title: 'Done!',
                  timeout: 1000,
                });
              });
            },
          },
        ],
      });
    });

    App.regions.getRegion('main').show(mainView);

    const headerView = new HeaderView({
      model: new Backbone.Model({
        title: 'Settings',
      }),
    });
    App.regions.getRegion('header').show(headerView);
  },

  deleteAllRecords() {
    let body = 'Are you sure you want to clear all records from list?' +
        '</br>Choose this option if you want to start a new Plant Hunt list';

    App.regions.getRegion('dialog').show({
      title: 'Clear list',
      body,
      buttons: [
        {
          title: 'Cancel',
          onClick() {
            App.regions.getRegion('dialog').hide();
          },
        },
        {
          title: 'Clear',
          class: 'btn-negative',
          onClick() {
            Log('Settings:Menu:Controller: removing all records');

            // delete all
            recordManager.removeAllSynced(() => {
              App.regions.getRegion('dialog').show({
                title: 'Done!',
                timeout: 1000,
              });
            });
            Analytics.trackEvent('Settings', 'delete all');
          },
        },
      ],
    });
  },

  sendAllRecords() {
    App.regions.getRegion('dialog').show({
      title: 'Submit All',
      body: 'Are you sure you want to set all valid records for submission?',
      buttons: [
        {
          title: 'Cancel',
          onClick() {
            App.regions.getRegion('dialog').hide();
          },
        },
        {
          title: 'OK',
          class: 'btn-positive',
          onClick() {
            Log('Settings:Menu:Controller: sending all records');

            recordManager.setAllToSend((err) => {
              if (err) {
                App.regions.getRegion('dialog').error(err);
              } else {
                // this is wrong as callback called after first record sent rather than all

                App.regions.getRegion('dialog').show({
                  title: 'Done!',
                  timeout: 1000,
                });
              }
            });
            Analytics.trackEvent('Settings', 'send all');
          },
        },
      ],
    });
  },

  resetApp(callback) {
    Log('Settings:Menu:Controller: resetting the application!', 'w');

    appModel.clear().set(appModel.defaults);
    appModel.setUuid();
    appModel.save();

    userModel.clear().set(userModel.defaults);
    userModel.save();

    recordManager.clearAll(true, callback);

    Analytics.trackEvent('Settings', 'reset app');
  },
};

export { API as default };
