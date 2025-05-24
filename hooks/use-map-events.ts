"use client"

import { useEffect, useRef } from "react"
import { Map, MapMouseEvent, MapTouchEvent } from "maplibre-gl"

type MapEventType =
  | "click"
  | "dblclick"
  | "mousedown"
  | "mouseup"
  | "mousemove"
  | "mouseenter"
  | "mouseleave"
  | "mouseover"
  | "mouseout"
  | "contextmenu"
  | "touchstart"
  | "touchend"
  | "touchcancel"
  | "movestart"
  | "move"
  | "moveend"
  | "dragstart"
  | "drag"
  | "dragend"
  | "zoomstart"
  | "zoom"
  | "zoomend"
  | "rotatestart"
  | "rotate"
  | "rotateend"
  | "pitchstart"
  | "pitch"
  | "pitchend"
  | "boxzoomstart"
  | "boxzoomend"
  | "boxzoomcancel"
  | "load"
  | "render"
  | "idle"
  | "error"
  | "data"
  | "styledata"
  | "sourcedata"
  | "dataloading"
  | "styledataloading"
  | "sourcedataloading"
  | "styleimagemissing"
  | "webglcontextlost"
  | "webglcontextrestored"

type EventHandler<T extends MapEventType> = T extends
  | "click"
  | "dblclick"
  | "mousedown"
  | "mouseup"
  | "mousemove"
  | "mouseenter"
  | "mouseleave"
  | "mouseover"
  | "mouseout"
  | "contextmenu"
  ? (e: MapMouseEvent) => void
  : T extends "touchstart" | "touchend" | "touchcancel"
    ? (e: MapTouchEvent) => void
    : (e: any) => void

interface MapEventHandlers {
  [key: string]: EventHandler<any>
}

interface UseMapEventsOptions {
  map: Map | null
  eventHandlers: {
    [K in MapEventType]?: EventHandler<K>
  }
}

/**
 * Hook to manage map event listeners
 *
 * @param options Configuration options for map events
 */
export function useMapEvents({ map, eventHandlers }: UseMapEventsOptions) {
  // Use a ref to store the current event handlers to avoid unnecessary re-renders
  const handlersRef = useRef<MapEventHandlers>(eventHandlers)

  // Update the ref when eventHandlers change
  useEffect(() => {
    handlersRef.current = eventHandlers
  }, [eventHandlers])

  // Set up event listeners
  useEffect(() => {
    if (!map) return

    // Add event listeners from the eventHandlers prop
    const currentEntries = Object.entries(eventHandlers) as [
      MapEventType,
      EventHandler<any> | undefined
    ][]

    currentEntries.forEach(([event, handler]) => {
      if (handler) {
        // Only add if handler is defined
        map.on(event, handler)
      }
    })

    // Cleanup function to remove event listeners
    return () => {
      // Remove the listeners that were added by this effect run
      currentEntries.forEach(([event, handler]) => {
        // Check if map and style are still valid, and if a handler was actually attached
        if (handler && map && map.getStyle()) {
          map.off(event, handler)
        }
      })
    }
  }, [map, eventHandlers]) // React to changes in map or eventHandlers

  // Function to add an event listener
  const addEventListener = <T extends MapEventType>(
    event: T,
    handler: EventHandler<T>
  ) => {
    if (!map) return

    map.on(event, handler as any)
    handlersRef.current = {
      ...handlersRef.current,
      [event]: handler
    }
  }

  // Function to remove an event listener
  const removeEventListener = <T extends MapEventType>(
    event: T,
    handler: EventHandler<T>
  ) => {
    if (!map) return

    map.off(event, handler as any)

    const newHandlers = { ...handlersRef.current }
    delete newHandlers[event]
    handlersRef.current = newHandlers
  }

  return {
    addEventListener,
    removeEventListener
  }
}
