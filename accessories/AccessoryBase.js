class AccessoryBase {
  static displayName() {}
  static description() {}

  constructor(platform, accessoryName, nlType, nlChannel, nlId) {
    this.accessoryName = accessoryName;
    this.platform = platform;
    this.nlType = nlType;
    this.nlChannel = nlChannel;
    this.nlId = nlId;

    return this.init();
  }

  getAccessoryInformation() {
    return {};
  }

  getAccessoryCategory() {
    return null;
  }

  static setCharacteristicCallbacks(platform, accessory) {
  }

  getServices() {
    let result = [];

    let nlService = new this.platform.Service.NooLiteService(this.accessoryName);
    nlService.getCharacteristic(this.platform.Characteristic.NooLiteType).updateValue(this.nlType);
    nlService.getCharacteristic(this.platform.Characteristic.NooLiteChannel).updateValue(this.nlChannel);
    nlService.getCharacteristic(this.platform.Characteristic.NooLiteId).updateValue(this.nlId);
    result.push(nlService);

    // let batteryService  = new this.Service.BatteryService(accessoryName);
    // batteryService.getCharacteristic(this.Characteristic.StatusLowBattery);
    // batteryService.getCharacteristic(this.Characteristic.BatteryLevel);
    // batteryService.getCharacteristic(this.Characteristic.ChargingState);
    // result.push(batteryService);

    return result;
  }

  init() {
    let that = this;
    let uuid = this.platform.AccessoryUtil.getAccessoryUUID(this.nlChannel, this.nlType, this.nlId);
    let accessory = this.platform.AccessoryUtil.getByUUID(uuid);
    if(null === accessory) {
      accessory = new this.platform.PlatformAccessory(this.accessoryName, uuid, this.getAccessoryCategory());
      let accessoryInformation = this.getAccessoryInformation();
      accessory.getService(this.platform.Service.AccessoryInformation)
        .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInformation['Manufacturer'] || "Undefined")
        .setCharacteristic(this.platform.Characteristic.Model, accessoryInformation['Model'] || "Undefined")
        .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInformation['SerialNumber'] || "Undefined");

      this.getServices().forEach(function(service, index, serviceArr) {
          accessory.addService(service, that.accessoryName);
      });

      this.constructor.setCharacteristicCallbacks(this.platform, accessory);
      return accessory;
    }

    return null;
  }

}

module.exports = AccessoryBase;