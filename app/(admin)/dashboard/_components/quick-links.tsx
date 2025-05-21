"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Building,
  ClipboardList,
  FileText,
  Settings,
  Users
} from "lucide-react"

interface QuickLinkProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

function QuickLink({ title, description, icon, href }: QuickLinkProps) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:bg-muted/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function QuickLinks() {
  const links: QuickLinkProps[] = [
    {
      title: "Users",
      description: "Manage system users and access",
      icon: <Users className="h-5 w-5 text-blue-500" />,
      href: "/system-users"
    },
    {
      title: "Organizations",
      description: "Manage organizations and Node Officers",
      icon: <Building className="h-5 w-5 text-indigo-500" />,
      href: "/organizations"
    },
    {
      title: "Metadata",
      description: "Platform-wide metadata oversight",
      icon: <FileText className="h-5 w-5 text-amber-500" />,
      href: "/metadata-oversight"
    },
    {
      title: "System Settings",
      description: "Configure system parameters",
      icon: <Settings className="h-5 w-5 text-slate-500" />,
      href: "/system-settings"
    },
    {
      title: "Audit Logs",
      description: "Review system activity",
      icon: <ClipboardList className="h-5 w-5 text-emerald-500" />,
      href: "/audit-logs"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {links.map((link, i) => (
        <QuickLink key={i} {...link} />
      ))}
    </div>
  )
}
