# homebridge-noolite

NooLite плагин (для [USB MTRF-64](https://www.noo.com.by/mtrf-64-usb.html) или [МТRF-64](https://www.noo.com.by/mtrf-64.html) адапетов) для homebridge

Другие языки: [English](https://github.com/AlekseevAV/homebridge-noolite/blob/master/README.md)

ТГ канал: https://t.me/Noolite (tg://t.me/Noolite)

## QuickStart

1. Установить [homebridge](https://github.com/nfarina/homebridge)
2. Установить homebridge-noolite плагин

        $  sudo npm install -g --unsafe-perm homebridge-noolite

3. Добавить необходимые настройки homebridge в config.json

        ...
        "platforms": [
            {
              "platform": "NooLitePlatform",
              "serialPort": "/dev/tty.usbserial-AL032Z5U",
              "serverPort": "8080",
              "periodicAccessoryUpdate": 5,
              "requestTtl": 1000,
              "serialWriteDelayMs": 250
            }
          ]
        ...

    * `serialPort` - путь до последовательного порта MTRF адапетра _обязательный_
    * `serverPort` - порт веб-сервера, для привязки noolite устройств _опциональный, по умолчанию 8080_
    * `periodicAccessoryUpdate` - переодически обновляет статус NooLite-F устройств (в секундах) _опциональный, по умолчанию эта функция отключена_
    * `requestTtl` - время ожидания ответа от блока в миллисекундах
    * `serialWriteDelayMs` - задержка между отправками команд на блоки в миллисекунда (при слишком маленьком времени MTRF адаптер может не успевать обрабатывать запросы/ответы к блокам)

    Смотри файл `sampleConfig.json` для примера.

4. Выдать права для доступа к адаптеру
`sudo usermod -a -G dialout `

5. Запустить homebridge

## Описание

После удачного запуска web итерфейс будет доступен по адресу: `<device_ip>:8080`

На главной странице можно непосредственно взаимодейстовать с MTRF-64 адаптером, посылая предусмотренные команды или
побитово формируя команды, согласно [руководству MTRF-64](https://www.noo.com.by/assets/files/PDF/MTRF-64-USB.pdf).

На странице аксессуаров (`/acc`) доступно 2 раздела:

1. MTRF - взаимодействие с MTRF адапеторм и привязанными NooLite-F устройствами по каналам (0-63)
2. HomeKit - взаимодействие с HomeKit аксессуарами: список/создание/удаление

## Поддерживаемые NooLite устройства

#### Силовые блоки:
1. [SLF](https://www.noo.com.by/slf-1-300.html) блок с протоколом NooLite-F
2. [SUF](https://www.noo.com.by/silovoj-blok-suf-1-300.html) диммируемый блок с протоколом NooLite-F
3. [SU](https://www.noo.com.by/su111-200.html) блок
4. [SB](https://www.noo.com.by/silovoj-blok-sb111-150.html) блок
5. [SR](https://www.noo.com.by/silovoj-blok-sr211-2k0.html) блок
6. [SD](https://www.noo.com.by/silovoj-blok-SD111-180.html) RGB контроллер
7. [SRF-R](https://www.noo.com.by/silovoj-blok-srf-1-1000-r.html) блок для электроприводов роллет, рулонных штор, жалюзи, ворот и т.д.
8. [SRF-1-3000-T](https://www.noo.com.by/silovoj-blok-srf-1-3000-t.html) блок для управления электрическими системами обогрева

#### Датчики:
1. Motion sensor [PM112](https://www.noo.com.by/pm112-sensor.html)
2. Датчик температуры [PT112](https://www.noo.com.by/pt112.html)
3. Датчик температуры и влажности [PT111](https://www.noo.com.by/pt111.html)
4. Датчик протечки [WS-1](https://www.noo.com.by/datchik-protechki-ws-1.html)
5. Датчик открытия/закрытия [DS-1](https://www.noo.com.by/datchik-otkryitiyazakryitiya-ds-1.html)

#### Специфические аксессуары:
1. Акссессуар ворота - сделан на базе SLF блока, отсылает команду 8 (включает нагрузку на 1.5 секунды) по событиям Открыть/Закрыть.
   По умолчанию установлен интервал в 1 секунду на полное открытие/закрытие двери.

### TODO:
1. Конфигурирование SLF блока
2. UI/UX улучшения web интерфейса
