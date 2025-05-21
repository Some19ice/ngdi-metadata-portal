"use server"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import GeneralSettingsForm from "./_components/general-settings-form"

export default async function SystemSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <Button variant="secondary">Test System Connection</Button>
      </div>

      <p className="text-muted-foreground">
        Configure system-wide settings for the NGDI Portal. Changes made here
        will affect all users and organizations.
      </p>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security & Access</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic system configuration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access Settings</CardTitle>
              <CardDescription>
                Configure authentication, user sessions, and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Authentication Settings</h3>
                <p className="text-sm text-muted-foreground">
                  These settings control how users authenticate with the system
                </p>
                <Separator className="my-4" />
                <p className="text-amber-500">Settings panel coming soon</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Session Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure user session timeouts and security
                </p>
                <Separator className="my-4" />
                <p className="text-amber-500">Settings panel coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>
                Configure file storage and upload settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-500">Settings panel coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure system emails and notification templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-500">Settings panel coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-500">Settings panel coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View and manage system activity logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-500">Log viewer coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
