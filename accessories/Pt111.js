const {NooLiteRequest, NooLiteResponse} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class Pt111 extends AccessoryBase {
  static displayName() {
    return 'PT111';
  }
  static description() {
    return 'датчик температуры и влажности';
  }

  static getAccessoryCategory() {
    return 10;
  }

  initOrCreateServices() {
    super.initOrCreateServices();

    let tempService = this.getOrCreateService(this.platform.Service.TemperatureSensor);
    let currentTemperature = tempService.getCharacteristic(this.platform.Characteristic.CurrentTemperature);
    let tempLowBattery = tempService.addCharacteristic(this.platform.Characteristic.StatusLowBattery);

    let humService = this.getOrCreateService(this.platform.Service.HumiditySensor);
    let currentHum = humService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity);
    let humLowBattery = humService.addCharacteristic(this.platform.Characteristic.StatusLowBattery);

    
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

          //   010-датчик температуры (PT111)
          if (tempHumData.type === '010') {
            if (tempHumData.temp !== undefined) {
              currentTemperature.setValue(tempHumData.temp);
            }
            if (tempHumData.hum !== undefined) {
              currentHum.setValue(tempHumData.hum);
            }
            if (tempHumData.batteryLow !== undefined) {
              tempLowBattery.setValue(tempHumData.batteryLow);
              humLowBattery.setValue(tempHumData.batteryLow);
            }
          }
          break;
        case 20:
          tempLowBattery.setValue(true);
          humLowBattery.setValue(true);
          break;
      }
    });
  }

  getAccessoryInformation() {
        return {
            'Manufacturer': 'NooLite',
            'Model': 'PT111',
            'SerialNumber': '0.0.1'
        };
    }
}

module.exports = Pt111;
