"use client"

import { useSidebarContext } from "@/components/utilities/sidebar-provider"

export function useSidebar() {
  return useSidebarContext()
}
