/**
 * 通用右键菜单（抽屉）工具
 *
 * 用法：
 *   import { showContextMenu, ContextMenuItem } from '@/utils/contextMenu'
 *
 *   element.addEventListener('contextmenu', (e) => {
 *     e.preventDefault()
 *     showContextMenu(e, [
 *       { title: '删除', icon: '🗑', danger: true, callback: () => deleteItem() },
 *       { title: '复制',   icon: '📋', callback: () => copyItem() },
 *     ])
 *   })
 */

export interface ContextMenuItem {
  /** 菜单标题（显示文字） */
  title: string
  /** 可选图标（emoji / 文字均可） */
  icon?: string
  /** 是否为危险操作（红色文字，如删除） */
  danger?: boolean
  /** 是否禁用（点击不触发 callback，置灰显示） */
  disabled?: boolean
  /** 点击回调函数 */
  callback: () => void
}

const MENU_ID = 'global-context-menu'
const STYLE_ID = 'context-menu-keyframes'

/** 注入全局样式（与项目深色主题保持一致） */
function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes contextMenuFadeIn {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .global-context-menu {
      position: fixed;
      z-index: 2147483647;
      min-width: 160px;
      max-width: 280px;
      padding: 6px 0;
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3);
      animation: contextMenuFadeIn 0.15s ease-out;
      backdrop-filter: blur(8px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      user-select: none;
    }

    .global-context-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      font-size: 13px;
      line-height: 1.4;
      cursor: pointer;
      transition: background 0.1s, color 0.1s;
      color: #d0d0d0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .global-context-menu-item:hover:not(.disabled) {
      background: rgba(233, 69, 96, 0.15);
      color: #e94560;
    }

    .global-context-menu-item.danger {
      color: #f56c6c;
    }

    .global-context-menu-item.danger:hover:not(.disabled) {
      background: rgba(245, 108, 108, 0.15);
      color: #ff7875;
    }

    .global-context-menu-item.disabled {
      color: #666;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .global-context-menu-icon {
      flex-shrink: 0;
      font-size: 14px;
      width: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .global-context-menu-divider {
      height: 1px;
      margin: 4px 8px;
      background: rgba(255, 255, 255, 0.06);
    }
  `
  document.head.appendChild(style)
}

/** 关闭并移除当前存在的菜单 */
export function closeContextMenu(): void {
  const existing = document.getElementById(MENU_ID)
  if (existing) {
    existing.remove()
  }
  document.removeEventListener('mousedown', onOutsideClick, true)
  document.removeEventListener('keydown', onEscKey)
  document.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
}

/** 全局点击外部区域关闭 */
function onOutsideClick(e: MouseEvent): void {
  const menu = document.getElementById(MENU_ID)
  if (!menu) return
  if (!menu.contains(e.target as Node)) {
    closeContextMenu()
  }
}

/** ESC 键关闭 */
function onEscKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    closeContextMenu()
  }
}

/** 滚动 / 窗口大小变化时关闭（避免位置错位） */
function onScrollOrResize(): void {
  closeContextMenu()
}

/**
 * 显示右键菜单
 * @param event 触发右键的鼠标事件（用于定位）
 * @param items 菜单项数组
 */
export function showContextMenu(
  event: MouseEvent,
  items: (ContextMenuItem | 'divider')[]
): void {
  injectStyles()

  // 若已有菜单，先关闭（确保单例）
  closeContextMenu()

  const menu = document.createElement('div')
  menu.id = MENU_ID
  menu.className = 'global-context-menu'

  // 填充菜单项
  items.forEach((item) => {
    if (item === 'divider') {
      const divider = document.createElement('div')
      divider.className = 'global-context-menu-divider'
      menu.appendChild(divider)
      return
    }

    const menuItem = document.createElement('div')
    menuItem.className = 'global-context-menu-item'
    if (item.danger) menuItem.classList.add('danger')
    if (item.disabled) menuItem.classList.add('disabled')

    if (item.icon) {
      const iconEl = document.createElement('span')
      iconEl.className = 'global-context-menu-icon'
      iconEl.textContent = item.icon
      menuItem.appendChild(iconEl)
    }

    const titleEl = document.createElement('span')
    titleEl.textContent = item.title
    menuItem.appendChild(titleEl)

    menuItem.addEventListener('click', (e) => {
      e.stopPropagation()
      if (item.disabled) return
      item.callback()
      closeContextMenu()
    })

    menu.appendChild(menuItem)
  })

  // 先加入 DOM 才能测量尺寸
  document.body.appendChild(menu)

  // 计算定位（自动避开视口边界）
  const { clientX, clientY } = event
  const menuRect = menu.getBoundingClientRect()
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const GAP = 4 // 与边缘的最小间距

  let left = clientX
  if (left + menuRect.width > viewportW - GAP) {
    left = viewportW - menuRect.width - GAP
  }
  if (left < GAP) left = GAP

  let top = clientY
  if (top + menuRect.height > viewportH - GAP) {
    top = viewportH - menuRect.height - GAP
  }
  if (top < GAP) top = GAP

  menu.style.left = `${left}px`
  menu.style.top = `${top}px`

  // 内部点击阻止冒泡，避免被外部监听立即关闭
  menu.addEventListener('mousedown', (e) => {
    e.stopPropagation()
  })

  // 注册全局关闭事件（捕获阶段优先）
  document.addEventListener('mousedown', onOutsideClick, true)
  document.addEventListener('keydown', onEscKey)
  document.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
}

export default showContextMenu
