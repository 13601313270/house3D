interface MessageOptions {
  duration?: number
}

const containerId = 'message-container'
const styleId = 'message-keyframes'

function getContainer (): HTMLElement {
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `
    document.body.appendChild(container)
  }
  return container
}

function injectStyles (): void {
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
        max-height: 60px;
        margin-bottom: 10px;
      }
      to {
        opacity: 0;
        transform: translateX(100%);
        max-height: 0;
        margin-bottom: 0;
      }
    }

    .message-slide-out {
      animation: slideOut 0.3s ease-out forwards;
      overflow: hidden;
    }
  `
  document.head.appendChild(style)
}

function createMessage (type: 'info' | 'success' | 'warning' | 'error', text: string, options: MessageOptions = {}): void {
  injectStyles()

  const { duration = 3000 } = options

  const messageEl = document.createElement('div')
  messageEl.style.cssText = `
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 4px;
    min-width: 280px;
    max-width: 400px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    max-height: 60px;
  `

  const iconEl = document.createElement('span')
  iconEl.style.cssText = `
    font-size: 18px;
    margin-right: 10px;
  `

  const textEl = document.createElement('span')
  textEl.textContent = text
  textEl.style.cssText = `
    font-size: 14px;
    flex: 1;
  `

  const closeBtn = document.createElement('span')
  closeBtn.innerHTML = '&times;'
  closeBtn.style.cssText = `
    font-size: 18px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    margin-left: 10px;
  `
  closeBtn.onmouseenter = () => { closeBtn.style.opacity = '1' }
  closeBtn.onmouseleave = () => { closeBtn.style.opacity = '0.6' }

  let bgColor: string
  let textColor: string
  let icon: string

  switch (type) {
    case 'success':
      bgColor = '#f0f9eb'
      textColor = '#67c23a'
      icon = '✓'
      break
    case 'warning':
      bgColor = '#fffbeb'
      textColor = '#e6a23c'
      icon = '⚠'
      break
    case 'error':
      bgColor = '#fef2f2'
      textColor = '#f56c6c'
      icon = '✕'
      break
    default:
      bgColor = '#ecf5ff'
      textColor = '#409eff'
      icon = 'ℹ'
  }

  messageEl.style.backgroundColor = bgColor
  iconEl.style.color = textColor
  iconEl.textContent = icon
  textEl.style.color = textColor
  closeBtn.style.color = textColor

  messageEl.appendChild(iconEl)
  messageEl.appendChild(textEl)
  messageEl.appendChild(closeBtn)

  const container = getContainer()
  container.appendChild(messageEl)

  let removed = false

  const removeMessage = (): void => {
    if (removed) return
    removed = true

    messageEl.classList.add('message-slide-out')
    setTimeout(() => {
      messageEl.remove()
    }, 300)
  }

  closeBtn.onclick = removeMessage

  if (duration > 0) {
    setTimeout(removeMessage, duration)
  }
}

export const message = {
  info: (text: string, options?: MessageOptions): void => {
    createMessage('info', text, options)
  },
  success: (text: string, options?: MessageOptions): void => {
    createMessage('success', text, options)
  },
  warning: (text: string, options?: MessageOptions): void => {
    createMessage('warning', text, options)
  },
  error: (text: string, options?: MessageOptions): void => {
    createMessage('error', text, options)
  }
}

export default message
