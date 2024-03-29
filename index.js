const pjson = require('./package.json');
const server = require('./server');
const AccessoryUtil = require('./accessories');
const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');
const addNooLiteCharacteristics = require('./lib/customCharacteristics');
const MTRFSerial = require('./lib/MTRFSerial');
const NooLiteGUI = require('./lib/NooLiteGUI');
const {NooLiteRequest, NooLiteResponse} = require('./lib/serialClasses');


let PLUGIN_NAME = pjson.name,
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

    if (!config) {
        log.warn("Ignoring NooLite Platform setup because it is not configured");
        this.disabled = true;
        return;
    }

    log("NooLitePlatform v.", pjson.version);
    this.pjson = pjson;
    let platform = this;

    // Get settings from config
    let serverPort = config['serverPort'] || 8080,
        serialPort = config['serialPort'];

    this.immediatelyResponse = config['immediatelyResponse'] || false;
    this.periodicAccessoryUpdate = parseInt(config['periodicAccessoryUpdate']);

    // Use default periodicAccessoryUpdate if immediatelyResponse is specified and no periodicAccessoryUpdate provided
    if (this.immediatelyResponse && !this.periodicAccessoryUpdate) {
      this.periodicAccessoryUpdate = 5;
    }
    
    // Initialize
    this.AccessoryUtil = new AccessoryUtil(platform);
    this.server = server(this);

    // Serial port
    this.serialPort =  this.getSerial(serialPort, config);

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

  getSerial(serialPortPath, config) {
    let platform = this;

    let serialPort = new SerialPort(serialPortPath, { autoOpen: false, baudRate: config['serialBaudRate'] || 9600 });

    serialPort.tryToOpenPort = function(delayBetweenTries=5000) {
      if (this.isOpen) {
        this.close(_ => {
          this.tryToOpenPort.bind(this, delayBetweenTries)
        })
        return;
      }

      this.open(function(err) {
        if (err) {
          // Error serial port open callback
          platform.log.error('Cannot connect to NooLite-MTRF: ', err.message);
          SerialPort.list()
            .then((ports) => {
              platform.log.info('Available serial ports is:')
              ports.forEach((port) => console.info('\t', port.comName))
            })
            .catch((err) => platform.log.error('Cannot get serial port list: ', err)) 
            
            // Make next try after delayBetweenTries miliseconds
            platform.log.error('Next try after: ', delayBetweenTries);
            setTimeout(this.tryToOpenPort.bind(this, delayBetweenTries), delayBetweenTries);

        } else {
          platform.log('Success connect to NooLite MTRF')
        }
      });
    }

    serialPort.tryToOpenPort();

    serialPort.nlParser = serialPort.pipe(new ByteLength({length: 17}));

    serialPort.nlParser.on('data', function(data) {
        let nlReaponse = new NooLiteResponse(...data);

        if (nlReaponse.isId()) {
          // Emit event by NooLite id
          this.emit(`nlres:${nlReaponse.getStrId()}`, nlReaponse);
        }

        // Emit event by NooLite channel
        this.emit(`nlres:${nlReaponse.ch}`, nlReaponse);
        this.emit('nlres', nlReaponse);
    })

    serialPort.on('error', function(err) {
      platform.log.error('Serial port error: ', err)
      this.tryToOpenPort()
    })

    serialPort.on('close', function() {
      platform.log.error('Serial port close. Reconnecting...')
      this.tryToOpenPort()
    })

    serialPort.mtrfSerial = new MTRFSerial(platform, serialPort, config['requestTtl'], config['serialWriteDelayMs']);

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

    if(this.AccessoryUtil) {
        this.AccessoryUtil.initAccessory(accessory);
    }

    // Set the accessory to reachable if plugin can currently process the accessory,
    // otherwise set to false and update the reachability later by invoking
    // accessory.updateReachability()
    accessory.reachable = true;

    accessory.on('identify', (paired, callback) => {
      this.log(accessory.displayName, "Identify!!!");
      callback();
    });

    this.accessories.push(accessory);
  }

  configurationRequestHandler(context, request, callback) {
    return NooLiteGUI.apply(this, arguments);
  }

  // Sample function to show how developer can add accessory dynamically from outside event
  addAccessory(accessoryName, nlType, nlChannel, nlid) {
    this.log(`Add Accessory: ${accessoryName} ${nlType} ${nlChannel} ${nlid}`);

    let {created, accessory} = this.AccessoryUtil.getOrCreateAccessory(accessoryName, nlType, nlChannel, nlid);

    if (created) {
      this.accessories.push(accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }

    return accessory;
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

  sendCommand(command, callback) {
    this.log.debug('Serial message to send: ', command);
    this.serialPort.mtrfSerial.send(command, (err, nlRes) => {
      if (err) {
        this.log.error('Error on write: ', err.message);
        if (callback) {
          callback(err)
        }
        return
      }
      this.log('Request to MTRF: ', command);
      this.log('Response from MTRF: ', nlRes);
      
      if (callback) {
        callback(null, nlRes)
      }
    });
  }

}
