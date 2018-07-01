const menuDisplayNames = {
  addAccessory: 'Добавить аксессуар',
  removeAccessory: 'Удалить аксессуар'
}


const sections = {
  mainMenu: function(context, request, callback) {

    let respDict = {
      "type": "Interface",
      "interface": "list",
      "title": "Главное меню",
      "items": Object.values(menuDisplayNames)
    };

    return respDict
  },

  addAccessory: function(context, request, callback) {
    let current_step = context['step'] || 1;

    let respDict;
    let availableTypes = [];

    for (let typeCode in this.AccessoryUtil.availableAccessories) {
      if(this.AccessoryUtil.availableAccessories.hasOwnProperty(typeCode)) {
        let type = this.AccessoryUtil.availableAccessories[typeCode];
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
        id: request.response.inputs.nooliteId,
      };
      context['step'] = 3;
    } else if (current_step === 3) {
      this.uiSessions[request.sid].accType = availableTypes[request.response.selections["0"]].split(':')[0];

      // create accessory
      this.addAccessory(
        this.uiSessions[request.sid].name,
        this.uiSessions[request.sid].accType,
        this.uiSessions[request.sid].channel,
        this.uiSessions[request.sid].id
      );

      // show success screen
      respDict = {
        "type": "Interface",
        "interface": "instruction",
        "title": "Аксессуар успешно создан",
        "detail": `Аксессуар ${this.uiSessions[request.sid].name} (${this.uiSessions[request.sid].accType}) успешно создан.`,
        "showActivityIndicator": false,
        "showNextButton": true,
      }

      // reset steps to first screen, where user can add another accessory
      context['step'] = 1;
      delete this.uiSessions[request.sid];
    }

    return respDict
  },

  removeAccessory: function(context, request, callback) {
    let current_step = context['step'] || 1;
    let respDict;

    let availableAccessories = [];

    for (acc of this.accessories) {
      availableAccessories.push(`${acc.UUID}:${acc.displayName}`)
    }

    if (current_step === 1) {

      respDict = {
        "type": "Interface",
        "interface": "list",
        "title": "Выберите аксессуар, который вы хотите удалить",
        "items": availableAccessories
      };

      context['step'] = 2;

    } else if (current_step === 2) {
      let accUUID = availableAccessories[request.response.selections[0]].split(':')[0];

      // create accessory
      this.removeAccessory(accUUID);

      // show success screen
      respDict = {
        "type": "Interface",
        "interface": "instruction",
        "title": "Аксессуар успешно удален",
        "showActivityIndicator": false,
        "showNextButton": true,
      }

      // reset steps to first screen, where user can add another accessory
      context['step'] = 1;
      context['section'] = 'mainMenu';
      delete this.uiSessions[request.sid];
    }

    return respDict
  },
}

let getMenuSectionCodeByDisplayName = (displayName) => {
  return Object.keys(menuDisplayNames).find(key => menuDisplayNames[key] === displayName);
}

module.exports = function(context, request, callback) {
  this.log("Context: ", JSON.stringify(context));
  this.log("Request: ", JSON.stringify(request));

  if (request && request.type === 'Terminate') {
    delete this.uiSessions[request.sid];
    context['step'] = 1;
    context['section'] = 'mainMenu';
  }

  let current_section = context['section'] || 'mainMenu';

  if (request && current_section == 'mainMenu' && request.response && request.response.selections) {
    // menu section has been selected
    const selectedSectionDisplayName = Object.values(menuDisplayNames)[request.response.selections[0]];
    context['section'] = current_section = getMenuSectionCodeByDisplayName(selectedSectionDisplayName);
    context['step'] = 1;
  }

  let sectionResponse = sections[current_section].apply(this, arguments);

  // Invoke callback to update setup UI
  callback(sectionResponse);
}