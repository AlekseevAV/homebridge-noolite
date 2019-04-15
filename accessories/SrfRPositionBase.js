const {NooLiteRequest} = require('../lib/serialClasses');
const AccessoryBase = require('./AccessoryBase');


class SrfRPositionBase extends AccessoryBase {
  static displayName() {
    return 'SRF-1-1000-R';
  }
  static description() {
    return `Cиловой блок nooLite-F SRF-1-1000-R`;
  }

  static getAccessoryCategory() {
    return 4;
  }

  createPeriodicTasks() {
    super.initOrCreateServices();
    if (this.platform.periodicAccessoryUpdate) {
      setInterval(() => {
        this.log('send periodically update command');
        let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));
        this.platform.sendCommand(command, (err, nlRes) => {})
      }, this.platform.periodicAccessoryUpdate * 1000);
    }
  }

  initOrCreateServices() {
    super.initOrCreateServices();
    this.setPositionDebounce = this.debounce(this.setPosition, 1000)
  }

  debounce(f, ms) {

    let timer = null;
  
    return function (...args) {
      const onComplete = () => {
        f.apply(this, args);
        timer = null;
      }
  
      if (timer) {
        clearTimeout(timer);
      }
  
      timer = setTimeout(onComplete, ms);
    };
  }

  setPosition(value, callback) {
    this.log("Set position characteristic to " + value);

    // Управление позицией открытия/закрытия осуществляется в NooLite через задание соответствующей яркости
    // от 0 до 100
    let command = new NooLiteRequest(this.nlChannel, 6, 2, 0, 0, 0, value, 0, 0, 0, ...this.nlId.split(':'));

    this.platform.sendCommand(command, (err, nlRes) => {
      if (err) {
        this.log('Error on write: ', err.message);
        callback(new Error('Error on write'));
        return;
      } else if (nlRes.isError()) {
        this.log('Error on response: ', nlRes);
        callback(new Error('Error on response'));
        return;
      }

      callback();

      // проверяем статус изменения состояния две минуты
      let endCheckingTimestamp = new Date().getTime() + 2 * 60 * 1000;

      setTimeout(function check(retry=3) {
        this.getPosition((err, newValue) => {
          if (err) {
            if (retry > 3) {
              setTimeout(check.bind(this), 2000, retry - 1);
            }
          }
          let timeToCheckIsOver = new Date().getTime() > endCheckingTimestamp;
          
          // здесь мы получаем и проверяем не первоначальную команду таргет стейта, а запрашиваем
          // текущее его значение, так как оно уже могло поменяться

          // еще одна тонкость - так как блок возвращает состояние своей открытости/закрытости в
          // показателях от 0 до 255 и мы их переводим в 0-100 с использованием округления, то
          // были проблемы, когда, к примеру, значение 140 неверно округлялось и нам не получалось
          // установить, что текущее состояние == целевому. Решение: считаем, что текущее состояние
          // совпало с целевым, если целевое входи в массив [n - 1, n, n + 1], где n - текущее
          // состояние блока
          const newValueArray = [newValue - 1, newValue, newValue + 1];

          this.log(`Got value from block "${newValue}", target value "${this.targetPosition.value}"`);
          if (newValueArray.includes(this.targetPosition.value)) {
            this.currentPosition.setValue(this.targetPosition.value)
          } else if (!timeToCheckIsOver) {
            setTimeout(check.bind(this), 2000, 3)
          }

        })
      }.bind(this), 2000);

    })
    
  }

  getPosition(callback) {
    this.log("get position value");
    let acc = this.accessory;

    let command = new NooLiteRequest(this.nlChannel, 128, 2, 0, 0, 0, 0, 0, 0, 0, ...this.nlId.split(':'));

    this.platform.sendCommand(command, (err, nlRes) => {
      if (err) {
        this.log('Error on write: ', err.message);
        callback(new Error('Error on write'));
        return;
      } else if (nlRes.isError()) {
        this.log('Error on response: ', nlRes);
        callback(new Error('Error on response'));
        return;
      }

      let brightnessValue = acc.value || 0;

      if (nlRes.isState() && nlRes.fmt === 0) {
        // А в ответе блока яркость приходит уже от 0 до 255. То есть управлять нужно 0-100,
        // а получать ответ 0-255. Странно, но как есть.
        brightnessValue = Math.ceil(nlRes.d3 / 2.55);
      }

      callback(null, brightnessValue);
    })
  }

  getAccessoryInformation() {
      return {
          'Manufacturer': 'NooLite',
          'Model': 'SRF-1-1000-R',
          'SerialNumber': '0.0.1'
      };
  }
}

module.exports = SrfRPositionBase;
