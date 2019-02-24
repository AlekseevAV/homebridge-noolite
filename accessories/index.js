const availableAccessories = {
    'slf': require('./Slf'),
    'suf': require('./Suf'),
    'slfSwitch': require('./SlfSwitch'),
    'su': require('./Su'),
    'suSwitch': require('./SuSwitch'),
    'sb': require('./Sb'),
    'sr': require('./Sr'),
    'pt112': require('./Pt112'),
    'pt111': require('./Pt111'),
    'pm112': require('./Pm112'),
    'ws1': require('./Ws1'),
    'ds1': require('./Ds1'),
    'sd': require('./Sd'),
    'garageDoorSlf': require('./GarageDoorSlf'),
    'srfRDoor': require('./SrfRDoor'),
    'srfRGarageDoor': require('./SrfRGarageDoor'),
    'srfRWindow': require('./SrfRWindow'),
    'srfRWindowCovering': require('./SrfRWindowCovering')
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

    getAccessoryClass(nlType) {
        if (nlType in availableAccessories) {
            return availableAccessories[nlType];
        } else {
            this.platform.log('Unknown noolite type: ' + nlType);
        }
        return null;
    }

    initAccessory(accessory) {
        let accTypeClass = this.getAccessoryClass(accessory.context.NooLite.type);
        if (accTypeClass)
            new accTypeClass(this.platform, accessory);
        return accessory;
    }

    getOrCreateAccessory(accessoryName, nlType, nlChannel, nlId) {
        let accUUID = this.getAccessoryUUID(nlChannel, nlType, nlId);

        let existAccessory = this.getByUUID(accUUID);
        if (existAccessory) {
            return {created: false, accessory: existAccessory};
        }
        
        let newAccessory = this.add(accessoryName, nlType, nlChannel, nlId);
        return {created: true, accessory: newAccessory};
    }

    add(accessoryName, nlType, nlChannel, nlId) {
        let accTypeClass = this.getAccessoryClass(nlType);
        if (!accTypeClass) return;

        let accUUID = this.getAccessoryUUID(nlChannel, nlType, nlId);
        let accessory = new this.platform.PlatformAccessory(accessoryName, accUUID, accTypeClass.getAccessoryCategory());
        accessory.context['NooLite'] = {
            type: nlType,
            channel: nlChannel,
            id: nlId
        }
        new accTypeClass(this.platform, accessory);
        return accessory;
    }
}

module.exports = AccessoryUtil;
