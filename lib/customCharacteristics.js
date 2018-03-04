const inherits = require('util').inherits;

let Service, Characteristic;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    Characteristic.TimeToOpenClose = function() {
        Characteristic.call(this, 'Time to open/close', 'E1D8125C-BBBF-4632-BFE4-541E2C352EE1');
        this.setProps({
            format: Characteristic.Formats.UINT8,
            unit: Characteristic.Units.SECONDS,
            maxValue: 255,
            minValue: 1,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TimeToOpenClose, Characteristic);
    Characteristic.TimeToOpenClose.UUID = 'E1D8125C-BBBF-4632-BFE4-541E2C352EE1';

    Characteristic.NooLiteChannel = function() {
        Characteristic.call(this, 'NooLite channel', 'E863F10C-079E-48FF-3F57-9C2605A29F51');
        this.setProps({
            format: Characteristic.Formats.INT,
            maxValue: 63,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(Characteristic.NooLiteChannel, Characteristic);
    Characteristic.NooLiteChannel.UUID = 'E863F10C-079E-48FF-3F57-9C2605A29F51';

    Characteristic.NooLiteId = function() {
        Characteristic.call(this, 'NooLite ID', 'E863F10C-079E-48FF-3F57-9C2605A29F52');
        this.setProps({
            format: Characteristic.Formats.STRING,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(Characteristic.NooLiteId, Characteristic);
    Characteristic.NooLiteId.UUID = 'E863F10C-079E-48FF-3F57-9C2605A29F52';

    Characteristic.NooLiteType = function() {
        Characteristic.call(this, 'NooLite Type', 'E863F10C-079E-48FF-3F57-9C2605A29F53');
        this.setProps({
            format: Characteristic.Formats.STRING,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
        });
        this.value = this.getDefaultValue();
    };
    inherits(Characteristic.NooLiteType, Characteristic);
    Characteristic.NooLiteType.UUID = 'E863F10C-079E-48FF-3F57-9C2605A29F53';

    Service.NooLiteService = function (displayName, subtype) {
        Service.call(this, displayName, '00000BBD-0000-1000-8000-0026BB765291', subtype);
        // Required Characteristics
        this.addCharacteristic(Characteristic.NooLiteChannel);
        this.addCharacteristic(Characteristic.NooLiteType);
        // Optional Characteristics
        this.addOptionalCharacteristic(Characteristic.NooLiteId);
    };
    inherits(Service.NooLiteService, Service);
    Service.NooLiteService.UUID = '00000BBD-0000-1000-8000-0026BB765291';

    return {
        NooLiteChannel: Characteristic.NooLiteChannel,
        NooLiteId: Characteristic.NooLiteId,
        NooLiteType: Characteristic.NooLiteType,
        NooLiteService: Service.NooLiteService,
    };
};
