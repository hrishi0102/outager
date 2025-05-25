"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/store/auth-store";
import { ExternalLink, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, organization } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const publicUrl = organization
    ? `${window.location.origin}/${organization.slug}`
    : "";

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Please select an organization first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={organization.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={organization.slug} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Public Status Page</Label>
            <div className="flex items-center gap-2">
              <Input value={publicUrl} disabled />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(publicUrl)}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Link href={`/${organization.slug}`} target="_blank">
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this URL with your users to show them your service status
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your personal account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={user?.user_metadata?.full_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Account settings are managed through your authentication provider.
              Contact support if you need to update your information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Current usage statistics and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold">Unlimited</div>
              <div className="text-sm text-muted-foreground">Services</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">Unlimited</div>
              <div className="text-sm text-muted-foreground">Incidents</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            API keys and documentation for integrating with external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              API access is coming soon! You'll be able to programmatically
              manage your services and incidents through our REST API.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Delete Organization</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all associated data
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Organization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
