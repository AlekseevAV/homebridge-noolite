const availableAccessories = {
  'slf': require('./Slf')
};


class AccessoryUtil {
    constructor(platform) {
        this.platform = platform;
        this.availableAccessories = availableAccessories;
    }

    getByUUID(uuid) {
        return (uuid in this.platform.accessories) ? this.platform.accessories[uuid] : null;
    }

    getAccessoryUUID(nlChannel, nlId) {
        return this.platform.UUIDGen.generate(nlChannel + nlId);
    }

    getByChannel(nlChannel) {
      for (let accessory of this.platform.accessories) {
        if (accessory.nlChannel === nlChannel) {
          return accessory;
        }
      }
      return null;
    }

    processSerialResponse(response) {
      let accUUID = this.getAccessoryUUID(response.ch, response.getStrId());
      let acc = this.getByUUID(accUUID);
      if (acc !== null){
        let accClass = this.getAccessoryClass(acc);
      }
    }

    getAccessoryClass(accessory) {
      let nlType = accessory.getService(this.platform.Service.NooLiteService)
                            .getCharacteristic(this.platform.Characteristic.NooLiteType).value;

      if (nlType in availableAccessories) {
        return availableAccessories[nlType];
      } else {
        this.platform.log('Unknown noolite type: ' + nlType);
      }
      return null;
    }

    addExist(accessory) {
      let accessoryClass = this.getAccessoryClass(accessory);

      if (accessoryClass) {
        accessoryClass.setCharacteristicCallbacks(this.platform, accessory);
      }
    }

    add(accessoryName, nlType, nlChannel, nlId) {
      if (!(nlType in availableAccessories)) {
        console.log('Unknown noolite type: ' + nlType);
        return;
      }

      let accUUID = this.getAccessoryUUID(nlChannel, nlId);
      let existAccessory = this.getByUUID(accUUID);
      if (existAccessory !== null) {
        return existAccessory;
      }

      return new availableAccessories[nlType](this.platform, accessoryName, nlType, nlChannel, nlId);
    }

    remove(uuid) {
        delete this.platform.accessories[uuid];
    }
}

module.exports = AccessoryUtil;
