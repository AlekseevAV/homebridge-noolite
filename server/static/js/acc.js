let currentChannel = 0;

let sendCommandToChannel = (channel, cmd, mode=0, ctr=0, res=0, fmt=0, d0=0, d1=0, d2=0, d3=0, id0=0, id1=0, id2=0, id3=0) => {
    $.post(`/api/channels/${channel}/`, {cmd, mode, ctr, res, fmt, d0, d1, d2, d3, id0, id1, id2, id3});
};

let addAcc = (channel, mode=2) => {
    $.post(`/api/channels/${channel}/acc`, {mode: mode});
};

let deleteAllAccs = (channel) => {
    $.ajax({
        url: `/api/channels/${channel}`,
        type: 'DELETE'
    });
};

let switchAccState = (accRow) => {
    let reqData = {
        ch: accRow.dataset.channel,
        cmd: 4,
        mode: 2,
    };

    if (accRow.dataset.id) {
        let splittedId = accRow.dataset.id.split(':');
        reqData.id0 = splittedId[0];
        reqData.id1 = splittedId[1];
        reqData.id2 = splittedId[2];
        reqData.id3 = splittedId[3];
    }

    $.get('/api.htm', reqData);
    //.done(function (data) {
    //     discoverAccs(accRow.dataset.channel);
    // });
};

let discoverAccs = (channel) => {
    $.get(`/api/channels/${channel}/acc`).done(function (data) {
        let channelTab = $(`#channel-${channel}`).find(`tbody`);

        let accRows = '';
        for (let acc of data.accList) {
            accRows += `
                <tr style="cursor: pointer" data-id="${acc.id}" data-channel="${channel}" onclick="switchAccState(this)">
                    <td>${acc.id}</td>
                    <td>${acc.type}</td>
                    <td>${acc.version}</td>
                    <td>${acc.state}</td>
                    <td>${acc.brightness}</td>
                    <td>${acc.accessible}</td>
                 </tr>
             `;
        }

        channelTab.html(accRows || 'Не найдено');
    });
};


$('a[data-toggle="list"]').on('shown.bs.tab', function (e) {
    let selectedChannel = e.target.dataset.channel;
    console.log('Selected channel: ', selectedChannel);
    currentChannel = selectedChannel;
    discoverAccs(selectedChannel);
});

let updateHomeKitAccs = () => {
    $.get(`/api/hk/acc`).done((data) => {
        let accTableBody = $('#hk-list').find(`tbody`);

        accTableBody.html('');

        let accRows = '';
        for (let acc of data.accList) {
            let nlData = acc.context.NooLite;

            let characteristicsList = '';
            for (let service of acc.services) {
                // Пропускаем Identify сервис
                if (service.UUID === "0000003E-0000-1000-8000-0026BB765291") {
                    continue;
                }
                
                for (let characteristic of service.characteristics) {
                    characteristicsList += `${characteristic.displayName}: ${characteristic.value}<br/>`;
                }
            }

            accRows += `
                <tr data-uuid="${acc.UUID}" >
                    <td>${acc.displayName}</td>
                    <td>${nlData.type}</td>
                    <td>${nlData.channel}</td>
                    <td>${nlData.id}</td>
                    <td>${characteristicsList}</td>
                    <td style="cursor: pointer;" onclick="deleteHkAcc(this)">X</td>
                 </tr>
             `;
        }

        accTableBody.html(accRows || 'Не найдено');
    });
};

let deleteHkAcc = function(accRow) {
    $.ajax({
        url: `/api/hk/acc/${accRow.parentElement.dataset.uuid}`,
        type: 'DELETE'
    }).done(() => {
        updateHomeKitAccs();
    });
}

$('form[name="create-hk-acc"]').each(function () {
  var form = $(this);
  form.submit(function (e) {
    $.post('/api/hk/acc', form.serialize()).done(() => {
      updateHomeKitAccs();
    });
    e.preventDefault();
  });
});

$('#nl-type-select').on('change', function() {
  $('#nl-type-select-description').html(this.selectedOptions[0].dataset.description);
});

setTimeout(() => {
    discoverAccs(currentChannel);
    updateHomeKitAccs();
}, 200);
