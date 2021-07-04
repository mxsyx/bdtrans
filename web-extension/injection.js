const ATTRIBUTE_KEY = 'trans-id'
const MAX_TRANSFER_LENGTH = 3000

const API = (function(){
  const ua = navigator.userAgent
  if (ua.indexOf('Chrome') !== -1) {
    return chrome
  } else if (ua.indexOf('Firefox') !== -1) {
    return browser
  }
})();

const blockStyles = ['block', 'list-item']
const skipTags = ['PRE', 'svg', 'SCRIPT']

let counter = 0

function markNode(node) {
  const originMap = {}
  if (node.nodeType === document.TEXT_NODE && node.nodeValue.trim() !== '') {
    let parentNode = node.parentNode
    while (blockStyles.indexOf(getComputedStyle(parentNode).display) === -1) {
      if (parentNode.tagName === 'SCRIPT') break;
      parentNode = parentNode.parentNode
    }
    if (!parentNode.hasAttribute(ATTRIBUTE_KEY) && skipTags.indexOf(parentNode.tagName) === -1) {
      const transId = counter++
      parentNode.setAttribute(ATTRIBUTE_KEY, transId)
      originMap[transId] = { node: parentNode, content: parentNode.textContent.trim().replaceAll('\n', '') }
    }
  }
  if (node.hasChildNodes()) {
    const childNodes = Array.from(node.childNodes)
    for (const childNode of childNodes) {
      const _originMap = markNode(childNode)
      Object.assign(originMap, _originMap)
    }
  }
  return originMap
}

function cloneNode(originMap, targetMap) {
  for (const transId in targetMap) {
    const node = originMap[transId].node
    const newNode = node.cloneNode()
    newNode.removeAttribute(ATTRIBUTE_KEY)
    newNode.textContent = targetMap[transId]
    node.parentNode.insertBefore(newNode, node.nextSibling)
  }
}

function sleep(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

async function translate() {
  const originMap = markNode(document.body)

  let section = {}
  const sections = []
  for (const transId in originMap) {
    const paragraph = originMap[transId].content
    section[transId] = paragraph
    if (Object.values(section).join('\n').length > MAX_TRANSFER_LENGTH) {
      delete section[transId]
      sections.push(section)
      section = { [transId]: paragraph }
    }
  }
  sections.push(section)

  for (const section of sections) {
    const transIds = Object.keys(section)
    const q = Object.values(section).join('\n')
    try {
      const paragraphs = await new Promise(resolve => {
        chrome.runtime.sendMessage(q, resolve)
      })
      const targetMap = {}
      paragraphs.forEach((paragraph, index) => {
        targetMap[transIds[index]] = paragraph
      })
      cloneNode(originMap, targetMap)
    } catch (error) {
      console.error(error)
    }
    await sleep(1)
  }
}

API.runtime.onMessage.addListener(
  (command, sender, sendResponse) => {
    sendResponse(true)
    switch (command) {
      case 'translate': translate(); break;
    }
  })
