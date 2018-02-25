let currentChannel = 0;

let addAcc = (channel) => {
    $.post(`/api/channels/${channel}/acc`);
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


setTimeout(discoverAccs(currentChannel), 200);
