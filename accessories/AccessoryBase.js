class AccessoryBase {
  static displayName() {}
  static description() {}

  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;
    this.accessoryName = accessory.displayName;
    this.nlType = accessory.context.NooLite.type;
    this.nlChannel = accessory.context.NooLite.channel;
    this.nlId = accessory.context.NooLite.id;

    return this.init();
  }

  log(...args) {
    args.unshift(`${this.accessoryName} (${this.nlType}-${this.nlId})`);
    this.platform.log.apply(console, args);
  }

  getAccessoryInformation() {
    return {};
  }

  static getAccessoryCategory() {
    return null;
  }

  initOrCreateServices() {
    // Accessory Information
    let accessoryInformation = this.getAccessoryInformation();
    this.getOrCreateService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessoryInformation['Manufacturer'] || 'NooLite')
      .setCharacteristic(this.platform.Characteristic.Model, accessoryInformation['Model'] || 'Undefined')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessoryInformation['SerialNumber'] || 'Undefined');
  }

  getOrCreateService(service) {
    let accService = this.accessory.getService(service);
    if (!accService) {
      accService = this.accessory.addService(service);
    }
    return accService;
  }

  init() {
    // Инициализируем или создаем сервисы аксессуара
    this.initOrCreateServices();
  }
}

module.exports = AccessoryBase;