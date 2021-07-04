const API = (function(){
  const ua = navigator.userAgent
  if (ua.indexOf('Chrome') !== -1) {
    return chrome
  } else if (ua.indexOf('Firefox') !== -1) {
    return browser
  }
})();

(function () {
  const btn = document.getElementById("btn")
  btn.onclick = () => {
    API.tabs.query({ active: true, currentWindow: true }, tabs => {
      API.tabs.sendMessage(tabs[0].id, 'translate')
    })
  }
})();
