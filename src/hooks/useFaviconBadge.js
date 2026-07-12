import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useFaviconBadge(count = 0) {
  const location = useLocation()

  useEffect(() => {
    // 1. FAVICON BADGE
    const updateFavicon = (count) => {
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext('2d')

      // Base: emerald square with Activity icon
      ctx.fillStyle = '#10b981'
      ctx.roundRect(0, 0, 32, 32, 6)
      ctx.fill()

      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(6, 16)
      ctx.lineTo(10, 16)
      ctx.lineTo(12, 10)
      ctx.lineTo(16, 22)
      ctx.lineTo(18, 16)
      ctx.lineTo(26, 16)
      ctx.stroke()

      // Badge
      if (count > 0) {
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(25, 7, 8, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = 'white'
        ctx.font = 'bold 9px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(count > 9 ? '9+' : count, 25, 7)
      }

      const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
      link.type = 'image/png'
      link.rel = 'icon'
      link.href = canvas.toDataURL()
      document.head.appendChild(link)
    }

    // 2. TITLE
    const baseTitle = 'ClinicOS'
    let newTitle = baseTitle
    if (count > 0) {
      newTitle = `(${count}) ${baseTitle}` // Only show count, no ping
    }

    updateFavicon(count)
    document.title = newTitle

  }, [count, location.pathname])
}