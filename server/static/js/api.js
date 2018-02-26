$('form[name="request_form"]').each(function () {
  var form = $(this);
  form.submit(function (e) {
    $.get('/api.htm', form.serialize());
    e.preventDefault();
  });
});


let es = new EventSource("/api/nl-res-log/");

let logBody = $('#logBody');

es.addEventListener('nlres', function(e) {
  logBody.append(e.data);
});

let clearLog = () => logBody.html('');