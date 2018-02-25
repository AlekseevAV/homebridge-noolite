$('form[name="request_form"]').each(function () {
  var form = $(this);
  form.submit(function (e) {
    $.get('/api.htm', form.serialize());
    e.preventDefault();
  });
});
