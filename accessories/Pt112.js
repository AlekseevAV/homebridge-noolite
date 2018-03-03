const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Pt112 extends AccessoryBase {
  static displayName() {
    return 'PT112';
  }
  static description() {
    return 'датчик температуры';
  }

  static getAccessoryCategory() {
    return 10;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let service = this.getOrCreateService(this.platform.Service.TemperatureSensor);
    let currentTemperature = service.getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    let lowBattery = service.addCharacteristic(this.platform.Characteristic.StatusLowBattery);
    
    // Обработка поступивших команд от MTRF
    this.platform.serialPort.nlParser.on(`nlres:${this.nlChannel}`, (nlCmd) => {
      this.log('read data by CHANNEL: ', nlCmd);
      
      // mode 1 - NooLite RX
      if (nlCmd.mode !== 1) {
        return;
      }

      switch (nlCmd.cmd) {
        case 21:
          let tempHumData = nlCmd.sensorData();

          //   001-датчик температуры (PT112)
          if (tempHumData.type === '001') {
            if (tempHumData.temp !== undefined) {
              currentTemperature.setValue(tempHumData.temp);
            }
            if (tempHumData.batteryLow !== undefined) {
              lowBattery.setValue(tempHumData.batteryLow);
            }
          }
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
            'Model': 'PT112',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Pt112;
