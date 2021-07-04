// Baidu Translator.
// https://api.fanyi.baidu.com/doc/21
const BAIDU_FANYI_API = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
const BAIDU_FANYI_APP_ID = '20190725000321389'
const BAIDU_FANYI_APP_SECERT = '8y2hYuQU6PSXKdxxFHnI'

// Google Translator.
// https://translate.googleapis.com/translate_a/single?
// client=gtx&sl=en&tl=zh-CN&hl=zh-CN&dt=t&dt=bd&dj=1&source=icon&tk=721534.721534&q=hello

const API = (function(){
  const ua = navigator.userAgent
  if (ua.indexOf('Chrome') !== -1) {
    return chrome
  } else if (ua.indexOf('Firefox') !== -1) {
    return browser
  }
})();

async function translateByGoogle() {
  // TODO
}

async function translateByBaidu(q) {
  const salt = Math.random().toString(32).slice(2)
  const sign = md5(`${BAIDU_FANYI_APP_ID}${q}${salt}${BAIDU_FANYI_APP_SECERT}`)
  const payload = new URLSearchParams()
  payload.append('from', 'en')
  payload.append('to', 'zh')
  payload.append('appid', BAIDU_FANYI_APP_ID)
  payload.append('q', q)
  payload.append('salt', salt)
  payload.append('sign', sign)
  try {
    const response = await fetch(BAIDU_FANYI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload,
      mode: 'cors'
    })
    const data = await response.json()
    const result = data.trans_result.map(item => item.dst)
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}

API.runtime.onMessage.addListener(
  (q, sender, sendResponse) => {
    translateByBaidu(q)
      .then(result => {
        sendResponse(result)
      })
      .catch(error => {
        sendResponse(error)
      })
    return true
  })
