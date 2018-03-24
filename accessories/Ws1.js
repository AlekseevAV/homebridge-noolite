const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Ws1 extends AccessoryBase {
  static displayName() {
    return 'WS-1';
  }
  static description() {
    return 'датчик протечки';
  }

  static getAccessoryCategory() {
    return 10;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let service = this.getOrCreateService(this.platform.Service.LeakSensor);
    let leakDetected = service.getCharacteristic(this.platform.Characteristic.LeakDetected);
    let lowBattery = service.getCharacteristic(this.platform.Characteristic.StatusLowBattery);
    
    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);
      
      // mode 1 - NooLite RX
      if (nlCmd.mode !== 1) {
        return;
      }

      switch (nlCmd.cmd) {
        case 0:
          leakDetected.setValue(false);
          break;
        case 2:
          leakDetected.setValue(true);
          break;
        case 20:
          lowBattery.setValue(true);
          break;
      }
    });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'WS-1',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Ws1;
