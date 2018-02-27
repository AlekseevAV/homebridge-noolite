const server = require('./server');
const AccessoryUtil = require('./accessories');
const SerialPort = require('serialport');
const addNooLiteCharacteristics = require('./lib/customCharacteristics');
const NooLiteSerialParser = require('./lib/NooLiteSerialParser');


let PLUGIN_NAME = 'homebridge-noolite',
    PLATFORM_NAME = 'NooLitePlatform';


let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
  PlatformAccessory = homebridge.platformAccessory;
  Accessory = homebridge.hap.Accessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  addNooLiteCharacteristics(homebridge);

  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, NooLitePlatform, true);
};


class NooLitePlatform {
  constructor(log, config, api) {
    log("NooLitePlatform Init");
    let platform = this;

    // Get settings from config
    let serverPort = config['serverPort'] || 8080,
        serialPort = config['serialPort'];

    // Initialize
    this.AccessoryUtil = new AccessoryUtil(platform);
    this.server = server(this);

    // Serial port
    this.serialPort =  this.gerSerial(serialPort);

    // Homebridge
    this.Accessory = Accessory;
    this.PlatformAccessory = PlatformAccessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;

    this.log = log;
    this.accessories = [];
    this.uiSessions = {};

    this.server.listen(serverPort, function() {
      platform.log(`Server Listening on port ${serverPort}...`);
    });

    if (api) {
      // Save the API object as plugin needs to register new accessory via this object
      this.api = api;

      // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories.
      // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
      // Or start discover new accessories.
      this.api.on('didFinishLaunching', function() {
        platform.log("DidFinishLaunching");
      });
    }

  }

  gerSerial(serialPortPath) {
    let platform = this;
    let serialPort =  new SerialPort(serialPortPath);
    serialPort.nlParser = serialPort.pipe(new NooLiteSerialParser());


    serialPort.nlParser.on('nlres', function (nlCommand) {
      platform.log('NooLite command:', nlCommand);
    });


    // serialPort.on('readable', function () {
    //   // Read bytes if no other listeners present
    //   if (serialPort.listeners('readable').length === 1) {
    //     let data = serialPort.read(17);
    //     if (data){
    //       let res = new NooLiteResponse(...data);
    //       platform.log('Data:', res);
    //       // platform.AccessoryUtil.processSerialResponse(res);
    //     }
    //   }
    // });

    return serialPort;
  }

  deleteDisableAccessories(sid, model) {
    let accessoriesToRemove = [];

    let uuids = this.ParseUtil.getAccessoriesUUID(sid, model);
    for(let accessoryType in uuids) {
        if(this.ConfigUtil.getAccessoryDisable(sid, accessoryType)) {
            let accessory = this.AccessoryUtil.getByUUID(uuids[accessoryType]);
            if(accessory) {
                accessoriesToRemove.push(accessory);
            }
        }
    }

    if (accessoriesToRemove.length > 0) {
        this.unregisterPlatformAccessories(accessoriesToRemove);
    }
  }

  // Function invoked when homebridge tries to restore cached accessory.
  // Developer can configure accessory at here (like setup event handler).
  // Update current value.
  configureAccessory(accessory) {
    this.log(accessory.displayName, "Configure Accessory");
    let platform = this;

    if(this.AccessoryUtil) {
        this.AccessoryUtil.addExist(accessory);
    }

    // Set the accessory to reachable if plugin can currently process the accessory,
    // otherwise set to false and update the reachability later by invoking
    // accessory.updateReachability()
    accessory.reachable = true;

    accessory.on('identify', function(paired, callback) {
      platform.log(accessory.displayName, "Identify!!!");
      callback();
    });

    this.accessories.push(accessory);
  }

  // Handler will be invoked when user try to config your plugin.
  // Callback can be cached and invoke when necessary.
  configurationRequestHandler(context, request, callback) {
    this.log("Context: ", JSON.stringify(context));
    this.log("Request: ", JSON.stringify(request));

    if (request && request.type === 'Treminate') {
      delete this.uiSessions[request.sid];
      context['step'] = 1;
    }

    let current_step = context['step'] || 1;

    let respDict;
    let availableTypes = [];

    for (let typeCode in this.AccessoryUtil.availableAccesories) {
      if(this.AccessoryUtil.availableAccesories.hasOwnProperty(typeCode)) {
        let type = this.AccessoryUtil.availableAccesories[typeCode];
        availableTypes.push(`${typeCode}: ${type.displayName()} ${type.description()}`);
      }
    }

    if (current_step === 1) {
      respDict = {
        "type": "Interface",
        "interface": "input",
        "title": "Создание аксессуара",
        "items": [
          {
            "id": "name",
            "title": "Название",
            "placeholder": "Свет на кухне"
          },
          {
            "id": "channel",
            "title": "NooLite канал",
            "placeholder": "1"
          },
          {
            "id": "nooliteId",
            "title": "NooLite ID",
            "placeholder": "00:00:00:01"
          }
        ]
      };
      context['step'] = 2;
    } else if (current_step === 2) {

      respDict = {
        "type": "Interface",
        "interface": "list",
        "title": "Выберите тип устройства",
        "items": availableTypes
      };

      this.uiSessions[request.sid] = {
        name: request.response.inputs.name,
        channel: request.response.inputs.channel,
        id: request.response.inputs.id,
      };
      context['step'] = 3;
    } else if (current_step === 3) {
      this.uiSessions[request.sid].accType = availableTypes[request.response.selections["0"]].split(':')[0];

      this.addAccessory(
        this.uiSessions[request.sid].name,
        this.uiSessions[request.sid].accType,
        this.uiSessions[request.sid].channel,
        this.uiSessions[request.sid].id
      );

      // Invoke callback with config will let homebridge save the new config into config.json
      // Callback = function(response, type, replace, config)
      // set "type" to platform if the plugin is trying to modify platforms section
      // set "replace" to true will let homebridge replace existing config in config.json
      // "config" is the data platform trying to save

      context['step'] = 1;
      delete this.uiSessions[request.sid];
      // callback(null, "platform", true, {"platform":PLATFORM_NAME, "otherConfig":"SomeData"});
      return;
    }

    // Invoke callback to update setup UI
    callback(respDict);
  }

  // Sample function to show how developer can add accessory dynamically from outside event
  addAccessory(accessoryName, nlType, nlChannel, nlid) {
    this.log("Add Accessory");

    let newAccessory = this.AccessoryUtil.add(accessoryName, nlType, nlChannel, nlid);

    this.accessories.push(newAccessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [newAccessory]);
    return newAccessory;
  }

  updateAccessoriesReachability() {
    this.log("Update Reachability");
    for (let accessory of this.accessories) {
      accessory.updateReachability(!accessory.reachable);
    }
  }

  // Sample function to show how developer can remove accessory dynamically from outside event
  removeAccessory(UUID) {
    this.log("Remove Accessory");

    let acc = this.AccessoryUtil.getByUUID(UUID);
    if (acc) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
        let accIndex = this.accessories.indexOf(acc);
        if (accIndex > -1) {
            this.accessories.splice(accIndex, 1);
        }
    } else {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories);
      this.accessories = [];
    }
  }

  registerPlatformAccessories(accessories) {
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, accessories);
      accessories.forEach(function(accessory, index, arr) {
          this.log.info("create accessory - UUID: " + accessory.UUID);
          this.AccessoryUtil.add(accessory);
      });
  }

  unregisterPlatformAccessories(accessories) {
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, accessories);
    accessories.forEach(function(accessory, index, arr) {
        this.log.info("delete accessory - UUID: " + accessory.UUID);
    });
  }

  sendCommand(command) {
    console.log('Serail message to send: ', command);
    this.serialPort.write(command.toBytes(), null, function (err) {
      if (err) {
        return console.log('Error on write: ', err.message);
      }
      console.log('message written');
    });
  }

}
