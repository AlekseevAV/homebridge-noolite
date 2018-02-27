const availableAccessories = {
  'slf': require('./Slf')
};


class AccessoryUtil {
    constructor(platform) {
        this.platform = platform;
        this.availableAccessories = availableAccessories;
    }

    getAccSerciceCharacteristic(accUUID, serviceUUID, characteriscticUUIDOrName) {
        let service = this.getAccService(accUUID, serviceUUID);

        if (service) {
            for (let characteristic of service.characteristics) {
                if (characteristic.UUID === characteriscticUUIDOrName || characteristic.displayName === characteriscticUUIDOrName) {
                    return characteristic;
                }
            }
        }

        return null;
    }

    getAccService(accUUID, serviceUUID) {
        let acc = this.getByUUID(accUUID);

        if (acc) {
            for (let service of acc.services) {
                if (service.UUID === serviceUUID) {
                    return service;
                }
            }
        }

        return null;
    }

    getByUUID(uuid) {
        for (let acc of this.platform.accessories) {
            if (acc.UUID === uuid) {
                return acc;
            }
        }

        return null;
    }

    getAccessoryUUID(nlChannel, nlType, nlId) {
        return this.platform.UUIDGen.generate(nlChannel + nlType + nlId);
    }

    getByChannel(nlChannel) {
      for (let accessory of this.platform.accessories) {
        if (accessory.nlChannel === nlChannel) {
          return accessory;
        }
      }
      return null;
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

      let accUUID = this.getAccessoryUUID(nlChannel, nlType, nlId);
      let existAccessory = this.getByUUID(accUUID);
      if (existAccessory !== null) {
        return existAccessory;
      }

      return new availableAccessories[nlType](this.platform, accessoryName, nlType, nlChannel, nlId);
    }
}

module.exports = AccessoryUtil;
