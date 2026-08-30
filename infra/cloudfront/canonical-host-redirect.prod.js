// CloudFront Function (viewer-request, cloudfront-js-2.0)
var CANONICAL_HOST = 'www.oj-auto-detailing.com.au';

function queryString(qs) {
  var keys = Object.keys(qs);
  if (keys.length === 0) {
    return '';
  }

  var parts = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var param = qs[key];
    if (param.multiValue) {
      for (var j = 0; j < param.multiValue.length; j++) {
        parts.push(key + '=' + param.multiValue[j].value);
      }
    } else {
      parts.push(key + '=' + param.value);
    }
  }
  return '?' + parts.join('&');
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host.value.toLowerCase();

  if (host !== CANONICAL_HOST) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: {
          value: 'https://' + CANONICAL_HOST + request.uri + queryString(request.querystring)
        }
      }
    };
  }

  return request;
}
