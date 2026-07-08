import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const baseMenuItemClasses = 'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50'
const baseButtonClasses = 'inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50'

export function ActionMenu({ label, items = [], align = 'right', ariaLabel, buttonClassName = '', menuClassName = '', showChevron = true, buttonDisabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const visibleItems = items.filter((item) => item && item.hidden !== true)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        disabled={buttonDisabled}
        onClick={(event) => {
          event.stopPropagation()
          setIsOpen((current) => !current)
        }}
        aria-label={ariaLabel}
        className={`${buttonClassName || baseButtonClasses} ${buttonDisabled ? 'cursor-not-allowed opacity-60' : ''}`.trim()}
      >
        {label}
        {showChevron ? <ChevronDown className="h-4 w-4" /> : null}
      </button>

      {isOpen && (
        <div className={`absolute top-[calc(100%+0.5rem)] z-20 min-w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg ${align === 'right' ? 'right-0' : 'left-0'} ${menuClassName}`.trim()}>
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={(event) => {
                event.stopPropagation()
                if (item.disabled) {
                  return
                }
                item.onClick?.(event)
                setIsOpen(false)
              }}
              className={`${item.className || baseMenuItemClasses} ${item.disabled ? 'cursor-not-allowed opacity-60' : ''}`.trim()}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActionMenu
