class AccessoryBase {
  static displayName() {}
  static description() {}

  constructor(platform, accessory, accessoryName, nlType, nlChannel, nlId) {
    this.platform = platform;
    this.accessory = accessory;
    this.accessoryName = accessoryName || accessory.getService('NooLiteService').getCharacteristic('Name').value;
    this.nlType = nlType || accessory.getService('NooLiteService').getCharacteristic('nlType').value;
    this.nlChannel = nlChannel || accessory.getService('NooLiteService').getCharacteristic('nlChannel').value;
    this.nlId = nlId || accessory.getService('NooLiteService').getCharacteristic('nlId').value;

    return this.init();
  }

  log(...args) {
    args.unshift(`${this.accessoryName} (${this.nlType}-${this.nlId})`);
    this.platform.log.apply(console, args);
  }

  getAccessoryInformation() {
    return {};
  }

  getAccessoryCategory() {
    return null;
  }

  getServices() {
    let result = [];

    let nlService = new this.platform.Service.NooLiteService(this.accessoryName);
      
    result.push(nlService);

    return result;
  }

  setCharacteristicForService(service) {
    switch(typeof service) {
      case this.platform.Service.NooLiteService:
        service
          .setCharacteristic(this.platform.Characteristic.NooLiteType, this.nlType)
          .setCharacteristic(this.platform.Characteristic.NooLiteChannel, this.nlChannel)
          .setCharacteristic(this.platform.Characteristic.NooLiteId, this.nlId);
      case this.platform.Service.AccessoryInformation:
        let accessoryInformation = this.getAccessoryInformation();
        service
          .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInformation['Manufacturer'] || "Undefined")
          .setCharacteristic(this.platform.Characteristic.Model, accessoryInformation['Model'] || "Undefined")
          .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInformation['SerialNumber'] || "Undefined");
        return true;
    }
  }

  initAccessory(a) {
    if (this.accessory)
      let servicesList = this.accessory.services
    else
      let servicesList = this.getServices()
    
    for (let service of servicesList) {
      this.setCharacteristicForService(service);
    }
  }
}

module.exports = AccessoryBase;