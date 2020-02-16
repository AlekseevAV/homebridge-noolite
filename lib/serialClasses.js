class NooLiteMessage {
  constructor(ch, cmd, mode, id0, id1, id2, id3) {
    this.ch = parseInt(ch);
    this.cmd = parseInt(cmd);
    this.mode = parseInt(mode);
    this.id0 = parseInt(id0);
    this.id1 = parseInt(id1);
    this.id2 = parseInt(id2);
    this.id3 = parseInt(id3);

    this.idBytes = [this.id0, this.id1, this.id2, this.id3];
  }

  pad(num, size) {
      let s = num+"";
      while (s.length < size) {
        s = "0" + s;
      }
      return s;
  }

  byteToBit(bite) {
    if (bite < 0 || bite > 255 || bite % 1 !== 0) {
        throw new Error(bite + " does not fit in a byte");
    }
    return ("000000000" + bite.toString(2)).substr(-8)
  }

  getStrId() {
    let result = [];

    for (let item of this.idBytes) {
      result.push(this.pad(item, 2));
    }

    return result.join(':');
  }

  isId() {

    for (let item of this.idBytes) {
      // if any of id bytes not equal 0
      if (item !== 0) {
        return true;
      }
    }
    return false;
  }

  isEqual(otherMessage) {
    return this.mode === otherMessage.mode &&
           this.ch === otherMessage.ch;
  }

}


class NooLiteResponse extends NooLiteMessage {
  constructor(st, mode, ctr, togl, ch, cmd, fmt, d0, d1, d2, d3, id0, id1, id2, id3, crc, sp){
    super(ch, cmd, mode, id0, id1, id2, id3);
    this.st = parseInt(st);
    this.ctr = parseInt(ctr);
    this.togl = parseInt(togl);
    this.fmt = parseInt(fmt);
    this.d0 = parseInt(d0);
    this.d1 = parseInt(d1);
    this.d2 = parseInt(d2);
    this.d3 = parseInt(d3);
    this.crc = parseInt(crc);
    this.sp = parseInt(sp);
  }

  isError() {
    // Значение=0 – Команда выполнена
    // Значение=1 – Нет ответа от блока
    // Значение=2 – Ошибка во время выполнения
    // Значение=3 – Привязка выполнена
    let errors = [1, 2];
    return errors.includes(this.ctr);
  }

  isState() {
    // cmd 130 - Ответ от исполнительного устройства
    return !this.isError() && this.cmd === 130;
  }

  sensorData() {
    let sensorData = {
      temp: undefined,
      hum: undefined,
      type: undefined,
      analog: undefined,
      batteryLow: undefined
    };
    
    // 21 - Sens_Temp_Humi - Передает данные о температуре, влажности и состоянии элементов
    if (this.cmd === 21) {
      //     d3               d2            d1                 d0
      //  00000000         00000000      0000 000 0         00000000
      // |________|       |________|    |____|___|_|       |________|
      //     |                 |          |    |  |            |
      // analog (0-255)       hum      temp  type battery     temp

      let temp_bits = this.byteToBit(this.d1).slice(4) + this.byteToBit(this.d0);
      // Тип датчика:
      //   000-зарезервировано
      //   001-датчик температуры (PT112)
      //   010-датчик температуры/влажности (PT111)
      sensorData['type'] = this.byteToBit(this.d1).slice(1, 4);

      if (temp_bits[0] === '0') {
        // Если первый бит 0 - температура считается выше нуля
        sensorData['temp'] = parseInt(temp_bits, 2) / 10
      } else if (temp_bits[0] === '1') {
        // Если 1 - ниже нуля. В этом случае необходимо от 4096 отнять полученное значение
        sensorData['temp'] = -((4096 - parseInt(temp_bits, 2)) / 10)
      } else {
        this.log(`Temperature bit 0 must be 0 or 1, get: ${temp_bits[0]}`);
        sensorData['temp'] = -50;
      }

      // Если датчик PT111 (с влажностью), то получаем влажность из 3 байта данных
      if (sensorData['type'] === '010') {
        sensorData['hum'] = this.d2;
      }

      // analog
      sensorData['analog'] = this.d3

      sensorData['batteryLow'] = parseInt(this.byteToBit(this.d1)[0]);
    }

    return sensorData;
  }

  termostatData() {
    let termostatData = {
      temp: undefined,
      firmwareVersion: undefined,
      type: undefined,
      state: undefined,
      output_state: undefined,
      serviceMode: undefined
    };
    
    // D0 = тип устройства
    termostatData['type'] = this.d0;
    // D1 = версия прошивки
    termostatData['firmwareVersion'] = this.d1;
    // D3 = температура активного датчика
    termostatData['temp'] = this.d3;
    // D2 биты:
    //   0 - состояние устройства вкл/выкл
    //   4 - состояние выхода устройства вкл/выкл
    //   7 - сервисный режим вкл/выкл
    let d2_bits = this.byteToBit(this.d2);
    termostatData['state'] = d2_bits.slice(0, 1);
    termostatData['output_state'] = d2_bits.slice(3, 4)
    termostatData['serviceMode'] = d2_bits.slice(6, 7)

    return termostatData;
  }
}




class NooLiteRequest extends NooLiteMessage {
  constructor(ch, cmd, mode=0, ctr=0, res=0, fmt=0, d0=0, d1=0, d2=0, d3=0, id0=0, id1=0, id2=0, id3=0) {
    super(ch, cmd, mode, id0, id1, id2, id3);
    this.st = 171;
    this.ctr = parseInt(ctr);
    this.res = parseInt(res);
    this.fmt = parseInt(fmt);
    this.d0 = parseInt(d0);
    this.d1 = parseInt(d1);
    this.d2 = parseInt(d2);
    this.d3 = parseInt(d3);
    this.sp = 172;
  }

  get crc() {
    let bytes_array = [
      this.st,
      this.mode,
      this.ctr,
      this.res,
      this.ch,
      this.cmd,
      this.fmt,
      this.d0,
      this.d1,
      this.d2,
      this.d3,
      this.id0,
      this.id1,
      this.id2,
      this.id3,
    ];

    let sum = bytes_array.reduce(
       function(sum, current){
         return sum + current;
       }, 0
    );

    return ((sum < 256) ? sum : sum % 256);
  }

  toBytes() {
    return new Buffer([
      this.st,
      this.mode,
      this.ctr,
      this.res,
      this.ch,
      this.cmd,
      this.fmt,
      this.d0,
      this.d1,
      this.d2,
      this.d3,
      this.id0,
      this.id1,
      this.id2,
      this.id3,
      this.crc,
      this.sp
    ]);
  }

}


module.exports = {
  NooLiteResponse: NooLiteResponse,
  NooLiteRequest: NooLiteRequest
};
