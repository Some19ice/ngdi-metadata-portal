"use server"

import React from "react"

export default async function DocsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
