// Puerto de GROK/alcance-d-neural/app.js — red tipo conectoma en canvas,
// curvas orgánicas, partículas por sinapsis activa, glow. Diferencia
// deliberada con el original (Rev10): GROK fija `x,y` a mano por nodo
// para el dataset de vitamina D exacto — aquí el layout se CALCULA
// (anillos concéntricos por capa, nodos repartidos por ángulo dentro de
// su anillo), así funciona igual con cualquier dataset (spec Rev9,
// "cualquier flow"), no solo con 24 nodos concretos.
//
// Sin botón de "reproducir" ni animación de entrada (Rev8 quitó "Ver de
// nuevo" a propósito) — las partículas fluyen de forma ambiental
// continua por las aristas activas, sin control manual.
//
// Zoom/pan/autofit (Rev11-13): rueda = zoom hacia el cursor; arrastrar =
// mover; "Autofit" ajusta al contenido real (Rev13). Chips de capa
// arriba (filtro) + leyenda de color abajo (Rev12).
//
// Render "organismo de cristal" (Rev14, puerto de
// GROK/alcance-d-cascade-ui/app.js): nodos con aura + membrana
// translúcida + cavidad + orgánulos animados + núcleo con bloom + borde
// Fresnel + brillo especular, en vez de círculos planos — mismo
// principio que el resto del puerto: se toma el ESTILO de render, no
// las coordenadas fijas de GROK (el layout sigue siendo `computeLayout`,
// genérico).

import { useEffect, useRef, useState } from 'react'

const W = 1000
const H = 720
const CENTER = { x: W / 2, y: H / 2 }
const BASE_RADIUS = 90
const MAX_RADIUS = 300
const ZOOM_MIN = 0.6
const ZOOM_MAX = 4

const REACH_TO_STATE = { hit: 'on', faint: 'soft', spared: 'off' }
const STATE_LABEL = { on: 'Activo', soft: 'Rozado', off: 'Apagado' }

/** Anillo concéntrico por capa + ángulo por nodo dentro del anillo. Nodos
 * primarios van al centro, sea cual sea su capa. */
function computeLayout(layers, nodes) {
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id)
  const ringGap = sortedLayers.length > 1 ? (MAX_RADIUS - BASE_RADIUS) / (sortedLayers.length - 1) : 0
  const ringByLayer = new Map(sortedLayers.map((l, i) => [l.id, BASE_RADIUS + i * ringGap]))

  const nodesByLayer = new Map()
  for (const node of nodes) {
    if (!nodesByLayer.has(node.layer)) nodesByLayer.set(node.layer, [])
    nodesByLayer.get(node.layer).push(node)
  }

  const positions = new Map()
  for (const [layerId, layerNodes] of nodesByLayer) {
    const radius = ringByLayer.get(layerId) ?? MAX_RADIUS
    const ringIndex = sortedLayers.findIndex((l) => l.id === layerId)
    const rotationOffset = ringIndex * 0.35
    layerNodes.forEach((node, i) => {
      if (node.isPrimary) {
        positions.set(node.id, { x: CENTER.x, y: CENTER.y, r: 26 })
        return
      }
      const angle = (i / layerNodes.length) * Math.PI * 2 + rotationOffset
      positions.set(node.id, {
        x: CENTER.x + Math.cos(angle) * radius,
        y: CENTER.y + Math.sin(angle) * radius,
        r: node.critical ? 18 : 14,
      })
    })
  }
  return positions
}

function curvePoints(a, b) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const bend = Math.min(40, len * 0.18) * (a.x < b.x ? 1 : -0.6)
  return { cx: mx + nx * bend, cy: my + ny * bend }
}

function pointOnCurve(a, b, cx, cy, t) {
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y }
}

export default function NeuralGraph({ layers, dataset, nodeReach, onSelectNode }) {
  const canvasRef = useRef(null)
  const tooltipRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [focusLayerId, setFocusLayerId] = useState(null)
  const stateRef = useRef({
    positions: new Map(),
    particles: [],
    hoverId: null,
    focusLayerId: null,
    interacted: false,
    view: { zoom: 1, panX: 0, panY: 0 },
    reset: null,
  })

  useEffect(() => {
    stateRef.current.focusLayerId = focusLayerId
  }, [focusLayerId])

  useEffect(() => {
    const positions = computeLayout(layers, dataset.nodes)
    const particles = []
    dataset.edges.forEach((edge, i) => {
      const stateA = REACH_TO_STATE[nodeReach[edge.from] ?? 'spared']
      const stateB = REACH_TO_STATE[nodeReach[edge.to] ?? 'spared']
      if (stateA === 'off' || stateB === 'off') return
      const strength = stateA === 'on' && stateB === 'on' ? 1 : 0.45
      const n = 2 + Math.round(strength * 3)
      for (let k = 0; k < n; k++) {
        particles.push({ edge: i, t: Math.random(), speed: 0.0025 + Math.random() * 0.0035 * strength, size: 0.9 + Math.random() * 1.6 })
      }
    })
    stateRef.current.positions = positions
    stateRef.current.particles = particles
  }, [layers, dataset, nodeReach])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let time = 0
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Autofit real (Rev13): ajusta al CONTENIDO — el rectángulo que
    // realmente ocupan los nodos (+ radio + espacio de etiqueta), no al
    // lienzo abstracto 1000×720 completo (eso dejaba mucho margen vacío
    // y el zoom apenas cambiaba nada al pulsar el botón — bug reportado).
    // Deja un 8% de aire ("casi llega al límite", no pegado al borde).
    function contentBounds() {
      const positions = stateRef.current.positions
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const pos of positions.values()) {
        minX = Math.min(minX, pos.x - pos.r)
        maxX = Math.max(maxX, pos.x + pos.r)
        minY = Math.min(minY, pos.y - pos.r)
        maxY = Math.max(maxY, pos.y + pos.r + 24) // etiqueta debajo del nodo
      }
      if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: W, maxY: H }
      return { minX, minY, maxX, maxY }
    }

    function fitScale() {
      const b = contentBounds()
      const w = Math.max(1, b.maxX - b.minX)
      const h = Math.max(1, b.maxY - b.minY)
      return Math.min(canvas.width / w, canvas.height / h) * 0.92
    }
    function fitPan(scale) {
      const b = contentBounds()
      const cx = (b.minX + b.maxX) / 2
      const cy = (b.minY + b.maxY) / 2
      return { x: canvas.width / 2 - cx * scale, y: canvas.height / 2 - cy * scale }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      // El canvas rellena el panel real (ancho Y alto de su caja CSS,
      // que ya es height:100% del panel) — antes se forzaba una altura
      // fija por relación de aspecto, por eso no rellenaba (bug reportado).
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      if (!stateRef.current.interacted) {
        const s = fitScale()
        const p = fitPan(s)
        stateRef.current.view = { zoom: 1, panX: p.x, panY: p.y }
      }
    }

    function finalScale() {
      return fitScale() * stateRef.current.view.zoom
    }

    function toCanvasPixel(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height), rect }
    }

    function toGraph(clientX, clientY) {
      const { x: px, y: py, rect } = toCanvasPixel(clientX, clientY)
      const { panX, panY } = stateRef.current.view
      const s = finalScale()
      return { x: (px - panX) / s, y: (py - panY) / s, rect }
    }

    function resetView() {
      stateRef.current.interacted = false
      const s = fitScale()
      const p = fitPan(s)
      stateRef.current.view = { zoom: 1, panX: p.x, panY: p.y }
    }
    stateRef.current.reset = resetView

    function onWheel(ev) {
      ev.preventDefault()
      const before = toGraph(ev.clientX, ev.clientY)
      const view = stateRef.current.view
      const factor = ev.deltaY > 0 ? 0.9 : 1.1
      view.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, view.zoom * factor))
      stateRef.current.interacted = true
      const { x: px, y: py } = toCanvasPixel(ev.clientX, ev.clientY)
      const s = finalScale()
      view.panX = px - before.x * s
      view.panY = py - before.y * s
    }

    let dragging = false
    let dragStart = null
    let movedEnough = false

    function onPointerDown(ev) {
      dragging = true
      movedEnough = false
      const { panX, panY } = stateRef.current.view
      dragStart = { clientX: ev.clientX, clientY: ev.clientY, panX, panY }
      canvas.setPointerCapture(ev.pointerId)
    }

    function onPointerMove(ev) {
      if (dragging && dragStart) {
        const rect = canvas.getBoundingClientRect()
        const dx = (ev.clientX - dragStart.clientX) * (canvas.width / rect.width)
        const dy = (ev.clientY - dragStart.clientY) * (canvas.height / rect.height)
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          movedEnough = true
          stateRef.current.interacted = true
        }
        stateRef.current.view.panX = dragStart.panX + dx
        stateRef.current.view.panY = dragStart.panY + dy
        canvas.style.cursor = 'grabbing'
        return
      }
      const { node, rect } = hitTest(ev.clientX, ev.clientY)
      stateRef.current.hoverId = node ? node.id : null
      canvas.style.cursor = node ? 'pointer' : 'grab'
      const tip = tooltipRef.current
      if (!tip) return
      if (!node) {
        tip.hidden = true
        return
      }
      const state = REACH_TO_STATE[nodeReach[node.id] ?? 'spared']
      const layer = dataset.layers.find((l) => l.id === node.layer)
      tip.hidden = false
      tip.innerHTML = `<div class="neural-graph__tip-title">${node.name}</div><div class="neural-graph__tip-meta">${layer?.name ?? ''} · ${STATE_LABEL[state]}</div>`
      const px = ev.clientX - rect.left + 14
      const py = ev.clientY - rect.top + 14
      tip.style.left = `${Math.min(px, rect.width - 180)}px`
      tip.style.top = `${Math.min(py, rect.height - 60)}px`
    }

    function onPointerUp(ev) {
      if (dragging && !movedEnough) {
        const { node } = hitTest(ev.clientX, ev.clientY)
        if (node) {
          setSelectedId(node.id)
          onSelectNode(node.id)
        }
      }
      dragging = false
      dragStart = null
      canvas.style.cursor = 'grab'
    }

    function onLeave() {
      stateRef.current.hoverId = null
      if (tooltipRef.current) tooltipRef.current.hidden = true
    }

    function hitTest(clientX, clientY) {
      const { x, y, rect } = toGraph(clientX, clientY)
      let found = null
      let best = Infinity
      for (const node of dataset.nodes) {
        const pos = stateRef.current.positions.get(node.id)
        if (!pos) continue
        const d = Math.hypot(pos.x - x, pos.y - y)
        if (d < pos.r + 10 && d < best) {
          best = d
          found = node
        }
      }
      return { node: found, rect }
    }

    function draw() {
      const { positions, particles, hoverId, view, focusLayerId: focus } = stateRef.current
      const s = finalScale()
      ctx.setTransform(s, 0, 0, s, view.panX, view.panY)
      ctx.clearRect(-view.panX / s, -view.panY / s, canvas.width / s, canvas.height / s)

      const nodeById = new Map(dataset.nodes.map((n) => [n.id, n]))

      // fondo ambiental: glow tenue tras el/los nodo(s) primario(s) + polvo
      for (const pn of dataset.nodes) {
        if (!pn.isPrimary) continue
        const p = positions.get(pn.id)
        if (!p) continue
        const g = ctx.createRadialGradient(p.x, p.y, 20, p.x, p.y, 280)
        g.addColorStop(0, 'rgba(224,138,60,0.10)')
        g.addColorStop(0.5, 'rgba(224,138,60,0.03)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, 280, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(236,234,228,0.15)'
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 12.3 + time * 0.0002) * 0.5 + 0.5) * W
        const y = (Math.cos(i * 7.1 + time * 0.00015) * 0.5 + 0.5) * H
        ctx.globalAlpha = 0.06 + (i % 5) * 0.015
        ctx.beginPath()
        ctx.arc(x, y, 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // aristas
      dataset.edges.forEach((edge) => {
        const a = positions.get(edge.from)
        const b = positions.get(edge.to)
        if (!a || !b) return
        const nodeA = nodeById.get(edge.from)
        const nodeB = nodeById.get(edge.to)
        const dim = focus && nodeA?.layer !== focus && nodeB?.layer !== focus
        const stateA = REACH_TO_STATE[nodeReach[edge.from] ?? 'spared']
        const stateB = REACH_TO_STATE[nodeReach[edge.to] ?? 'spared']
        const active = stateA !== 'off' && stateB !== 'off'
        const isOn = stateA === 'on' && stateB === 'on'
        const { cx, cy } = curvePoints(a, b)

        ctx.globalAlpha = dim ? 0.2 : 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(cx, cy, b.x, b.y)
        if (!active) {
          ctx.strokeStyle = 'rgba(236,234,228,0.06)'
          ctx.lineWidth = 0.8
          ctx.setLineDash([3, 5])
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1
          return
        }
        ctx.lineWidth = isOn ? 1.8 : 1.15
        ctx.strokeStyle = isOn ? 'rgba(232,228,216,0.45)' : 'rgba(224,138,60,0.4)'
        ctx.stroke()
        if (isOn && !dim) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.quadraticCurveTo(cx, cy, b.x, b.y)
          ctx.strokeStyle = 'rgba(232,228,216,0.12)'
          ctx.lineWidth = 5
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      })

      // partículas ambientales
      if (!reduceMotion) {
        particles.forEach((p) => {
          const edge = dataset.edges[p.edge]
          if (!edge) return
          const a = positions.get(edge.from)
          const b = positions.get(edge.to)
          if (!a || !b) return
          p.t += p.speed
          if (p.t > 1) p.t -= 1
          const { cx, cy } = curvePoints(a, b)
          const pt = pointOnCurve(a, b, cx, cy, p.t)
          const stateA = REACH_TO_STATE[nodeReach[edge.from] ?? 'spared']
          const stateB = REACH_TO_STATE[nodeReach[edge.to] ?? 'spared']
          const isOn = stateA === 'on' && stateB === 'on'
          const nodeA = nodeById.get(edge.from)
          const nodeB = nodeById.get(edge.to)
          const dim = focus && nodeA?.layer !== focus && nodeB?.layer !== focus
          ctx.globalAlpha = dim ? 0.15 : 1
          ctx.beginPath()
          ctx.fillStyle = isOn ? 'rgba(232,228,216,0.85)' : 'rgba(224,138,60,0.8)'
          ctx.arc(pt.x, pt.y, p.size ?? 1.6, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })
      }

      // nodos — organismos de cristal (aura + membrana + núcleo + reflejo)
      dataset.nodes.forEach((node) => {
        const pos = positions.get(node.id)
        if (!pos) return
        const state = REACH_TO_STATE[nodeReach[node.id] ?? 'spared']
        const isSel = node.id === selectedId
        const isHov = node.id === hoverId
        const dim = focus && node.layer !== focus
        const isHub = !!node.isPrimary

        const rr = pos.r * (isSel || isHov ? 1.1 : 1)
        const pulse = state === 'on' && !dim ? 1 + Math.sin(time * 0.0025 + pos.x) * 0.03 : 1
        const R = rr * pulse
        const alphaMul = dim && state === 'off' ? 0.2 : dim ? 0.28 : 1

        ctx.save()
        ctx.globalAlpha = alphaMul

        // aura volumétrica
        if ((state === 'on' || state === 'soft') && !dim) {
          const aura = ctx.createRadialGradient(pos.x, pos.y, R * 0.15, pos.x, pos.y, R * 3.2)
          if (state === 'on') {
            aura.addColorStop(0, 'rgba(255,236,200,0.3)')
            aura.addColorStop(0.35, 'rgba(232,228,216,0.12)')
            aura.addColorStop(0.7, 'rgba(232,228,216,0.03)')
            aura.addColorStop(1, 'rgba(0,0,0,0)')
          } else {
            aura.addColorStop(0, 'rgba(224,138,60,0.22)')
            aura.addColorStop(1, 'rgba(0,0,0,0)')
          }
          ctx.fillStyle = aura
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, R * 3.2, 0, Math.PI * 2)
          ctx.fill()
        }

        // membrana translúcida (cristal)
        const shell = ctx.createRadialGradient(pos.x - R * 0.35, pos.y - R * 0.4, R * 0.05, pos.x, pos.y + R * 0.1, R * 1.05)
        if (state === 'on') {
          shell.addColorStop(0, 'rgba(255,252,245,0.55)')
          shell.addColorStop(0.25, 'rgba(230,225,205,0.18)')
          shell.addColorStop(0.55, 'rgba(120,116,100,0.12)')
          shell.addColorStop(0.82, 'rgba(40,38,32,0.35)')
          shell.addColorStop(1, 'rgba(20,18,15,0.55)')
        } else if (state === 'soft') {
          shell.addColorStop(0, 'rgba(230,180,120,0.35)')
          shell.addColorStop(0.5, 'rgba(120,85,45,0.12)')
          shell.addColorStop(1, 'rgba(30,22,14,0.5)')
        } else {
          shell.addColorStop(0, 'rgba(60,58,54,0.25)')
          shell.addColorStop(1, 'rgba(12,12,11,0.7)')
        }
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2)
        ctx.fillStyle = shell
        ctx.fill()

        // cavidad hueca
        if (state !== 'off') {
          const cavity = ctx.createRadialGradient(pos.x, pos.y, R * 0.1, pos.x, pos.y, R * 0.72)
          cavity.addColorStop(0, 'rgba(255,240,200,0.08)')
          cavity.addColorStop(0.6, 'rgba(0,0,0,0.15)')
          cavity.addColorStop(1, 'rgba(0,0,0,0.45)')
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, R * 0.72, 0, Math.PI * 2)
          ctx.fillStyle = cavity
          ctx.fill()
        }

        // orgánulos internos animados + anillos finos
        if (state !== 'off' && !dim) {
          const seeds = 5 + (isHub ? 4 : 0)
          for (let i = 0; i < seeds; i++) {
            const ang = (i / seeds) * Math.PI * 2 + time * 0.0004 * (state === 'on' ? 1 : 0.4) + pos.x * 0.01
            const rad = R * (0.22 + (i % 3) * 0.08)
            const ox = pos.x + Math.cos(ang) * rad * 0.55
            const oy = pos.y + Math.sin(ang) * rad * 0.55
            const ig = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 0.2)
            ig.addColorStop(0, state === 'on' ? 'rgba(255,230,180,0.5)' : 'rgba(224,138,60,0.35)')
            ig.addColorStop(1, 'rgba(255,230,180,0)')
            ctx.fillStyle = ig
            ctx.beginPath()
            ctx.arc(ox, oy, R * 0.18, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.strokeStyle = state === 'on' ? 'rgba(255,240,210,0.12)' : 'rgba(224,138,60,0.1)'
          ctx.lineWidth = 0.6
          for (let k = 0; k < 2; k++) {
            ctx.beginPath()
            ctx.ellipse(pos.x, pos.y, R * (0.4 + k * 0.18), R * (0.32 + k * 0.15), Math.sin(time * 0.0008 + pos.y) * 0.3, 0, Math.PI * 2)
            ctx.stroke()
          }
        }

        // núcleo brillante + halo
        if (state === 'on' && !dim) {
          const coreR = isHub ? R * 0.28 : R * 0.22
          const core = ctx.createRadialGradient(pos.x - coreR * 0.2, pos.y - coreR * 0.25, 0, pos.x, pos.y, coreR)
          core.addColorStop(0, 'rgba(255,252,240,1)')
          core.addColorStop(0.35, 'rgba(255,220,150,0.9)')
          core.addColorStop(0.7, 'rgba(180,140,70,0.65)')
          core.addColorStop(1, 'rgba(80,50,20,0)')
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, coreR, 0, Math.PI * 2)
          ctx.fillStyle = core
          ctx.fill()
          const bloom = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, coreR * 2.2)
          bloom.addColorStop(0, 'rgba(255,230,160,0.35)')
          bloom.addColorStop(1, 'rgba(255,230,160,0)')
          ctx.fillStyle = bloom
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, coreR * 2.2, 0, Math.PI * 2)
          ctx.fill()
        } else if (state === 'soft' && !dim) {
          const coreR = R * 0.16
          const core = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, coreR)
          core.addColorStop(0, 'rgba(224,180,120,0.8)')
          core.addColorStop(1, 'rgba(120,80,40,0)')
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, coreR, 0, Math.PI * 2)
          ctx.fillStyle = core
          ctx.fill()
        }

        // borde Fresnel
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, R, 0, Math.PI * 2)
        ctx.strokeStyle = state === 'off' ? 'rgba(236,234,228,0.14)' : state === 'on' ? 'rgba(255,248,230,0.5)' : 'rgba(224,138,60,0.4)'
        ctx.lineWidth = isSel ? 2.2 : isHub ? 1.6 : 1.05
        if (state === 'off') ctx.setLineDash([2.5, 3.5])
        ctx.stroke()
        ctx.setLineDash([])

        // reflejo especular (cristal mojado)
        if (state !== 'off' && !dim) {
          ctx.beginPath()
          ctx.ellipse(pos.x - R * 0.32, pos.y - R * 0.38, R * 0.22, R * 0.12, -0.5, 0, Math.PI * 2)
          const spec = ctx.createRadialGradient(pos.x - R * 0.32, pos.y - R * 0.38, 0, pos.x - R * 0.32, pos.y - R * 0.38, R * 0.22)
          spec.addColorStop(0, 'rgba(255,255,255,0.75)')
          spec.addColorStop(0.4, 'rgba(255,255,255,0.2)')
          spec.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = spec
          ctx.fill()
          ctx.beginPath()
          ctx.arc(pos.x + R * 0.28, pos.y + R * 0.2, R * 0.05, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.25)'
          ctx.fill()
        }

        ctx.restore()

        // etiqueta
        if (state !== 'off' && (!dim || isSel || isHov)) {
          ctx.font = `${state === 'on' && !dim ? 600 : 400} ${isHub ? 14 : state === 'on' ? 12 : 11}px "IBM Plex Sans", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = state === 'on' ? (dim ? 'rgba(242,239,232,0.3)' : '#f5f0e6') : dim ? 'rgba(224,138,60,0.35)' : '#e08a3c'
          ctx.fillText(node.name, pos.x, pos.y + R + 8)
        }
      })
    }

    function tick(now) {
      time = now
      draw()
      raf = requestAnimationFrame(tick)
    }

    resize()
    canvas.style.cursor = 'grab'
    window.addEventListener('resize', resize)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [dataset, nodeReach, onSelectNode, selectedId])

  return (
    <div className="neural-graph">
      <div className="neural-graph__layers" role="tablist" aria-label="Filtrar por capa">
        <button
          type="button"
          className={`neural-graph__layer-chip${!focusLayerId ? ' neural-graph__layer-chip--active' : ''}`}
          onClick={() => setFocusLayerId(null)}
        >
          Todas
        </button>
        {[...layers]
          .sort((a, b) => a.id - b.id)
          .map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`neural-graph__layer-chip${focusLayerId === layer.id ? ' neural-graph__layer-chip--active' : ''}`}
              onClick={() => setFocusLayerId(focusLayerId === layer.id ? null : layer.id)}
            >
              {layer.name}
            </button>
          ))}
      </div>

      <canvas ref={canvasRef} className="neural-graph__canvas" aria-label="Grafo neuronal del flujo" />
      <div ref={tooltipRef} className="neural-graph__tip" hidden />
      <button type="button" className="neural-graph__autofit" onClick={() => stateRef.current.reset?.()}>
        Autofit
      </button>

      <div className="neural-graph__legend">
        <span>
          <i className="neural-graph__pip neural-graph__pip--on" /> Activo
        </span>
        <span>
          <i className="neural-graph__pip neural-graph__pip--soft" /> Rozado
        </span>
        <span>
          <i className="neural-graph__pip neural-graph__pip--off" /> Apagado
        </span>
      </div>
    </div>
  )
}
