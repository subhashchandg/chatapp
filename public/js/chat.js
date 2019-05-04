var socket = io();

function scrollToBottom () {
  // Selectors
  var messages = jQuery('#messages');
  var newMessage = messages.children('li:last-child')
  // Heights
  var clientHeight = messages.prop('clientHeight');
  var scrollTop = messages.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

socket.on('connect', function () {
  var params = Qs.parse(window.location.search,{ ignoreQueryPrefix: true });

  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error');
    }
  });
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function (users) {
  var ol = jQuery('<ol></ol>');

  users.forEach(function (user) {
    ol.append(jQuery('<li></li>').text(user));
  });

  jQuery('#users').html(ol);
});

socket.on('newMessage', function (message) {
  
  var params = Qs.parse(window.location.search,{ ignoreQueryPrefix: true });
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#message-template').html();
  var html = Mustache.render(template, {
    text: message.text,
    from: message.from === params.name ? 'You': message.from,
    createdAt: formattedTime,
    float: message.from === params.name ? 'float_right': null,
    clear: 'clear_right'
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});

socket.on('someoneistyping', function (name) {
   jQuery('#typing-message').text(`${name} is typing...`)
});

socket.on('stoppedtyping', function () {
  jQuery('#typing-message').text("")
});

socket.on('newLocationMessage', function (message) {
  var params = Qs.parse(window.location.search,{ ignoreQueryPrefix: true });
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#location-message-template').html();
  var html = Mustache.render(template, {
    url: message.url,
    from: message.from === params.name ? 'You': message.from,
    createdAt: formattedTime,
    float: message.from === params.name ? 'float_right': null,
    clear: 'clear_right'
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});
var messageTextbox = jQuery('[name=message]')
messageTextbox.on('input',(e)=> {
  socket.emit('someoneistyping', {},function () {
    messageTextbox.focus()
  });
})

messageTextbox.on('blur',(e)=> {
  socket.emit('stoppedtyping');
})



jQuery('#message-form').on('submit', function (e) {
  e.preventDefault();

  var messageTextbox = jQuery('[name=message]');

  socket.emit('createMessage', {
    text: messageTextbox.val()
  }, function () {
    messageTextbox.val('')
    messageTextbox.focus()
    socket.emit('stoppedtyping');
  });
});

var locationButton = jQuery('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').text('Sending location...');

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location.');
  });
});
