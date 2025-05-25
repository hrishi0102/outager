"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/store/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  Calendar,
  ArrowRight,
  LogOut,
  Settings,
} from "lucide-react";

const demoServices = [
  {
    id: 1,
    name: "Website",
    description: "Main company website and landing pages",
    status: "operational",
  },
  {
    id: 2,
    name: "API Gateway",
    description: "Core API services and endpoints",
    status: "operational",
  },
  {
    id: 3,
    name: "User Dashboard",
    description: "Customer portal and user interface",
    status: "degraded",
  },
  {
    id: 4,
    name: "Database",
    description: "Primary database cluster",
    status: "operational",
  },
  {
    id: 5,
    name: "File Storage",
    description: "Document and media storage service",
    status: "operational",
  },
];

const demoIncidents = [
  {
    id: 1,
    title: "Dashboard Performance Issues",
    status: "monitoring",
    created_at: "2024-01-15T14:30:00Z",
    updates: [
      {
        id: 1,
        message:
          "We are monitoring the fix we deployed to address the dashboard performance issues. Response times have improved significantly.",
        status: "monitoring",
        created_at: "2024-01-15T16:45:00Z",
      },
      {
        id: 2,
        message:
          "We have identified the root cause of the performance issues and are deploying a fix. Users may continue to experience slower than normal response times.",
        status: "identified",
        created_at: "2024-01-15T15:20:00Z",
      },
      {
        id: 3,
        message:
          "We are investigating reports of slow loading times in the user dashboard. Our team is working to identify the cause.",
        status: "investigating",
        created_at: "2024-01-15T14:30:00Z",
      },
    ],
  },
];

const resolvedIncidents = [
  {
    id: 2,
    title: "API Rate Limiting Issues",
    status: "resolved",
    created_at: "2024-01-10T09:15:00Z",
    resolved_at: "2024-01-10T11:30:00Z",
    updates: [
      {
        id: 4,
        message:
          "All systems are now operating normally. API rate limits have been restored to normal levels.",
        status: "resolved",
        created_at: "2024-01-10T11:30:00Z",
      },
      {
        id: 5,
        message:
          "We have implemented a fix and are gradually restoring normal API rate limits.",
        status: "monitoring",
        created_at: "2024-01-10T10:45:00Z",
      },
      {
        id: 6,
        message:
          "We are investigating reports of API requests being rate limited more aggressively than expected.",
        status: "investigating",
        created_at: "2024-01-10T09:15:00Z",
      },
    ],
  },
];

const statusConfig = {
  operational: {
    icon: CheckCircle,
    label: "Operational",
    color: "text-green-500",
    bgColor: "bg-green-500",
    variant: "default",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded Performance",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500",
    variant: "secondary",
  },
  partial_outage: {
    icon: AlertCircle,
    label: "Partial Outage",
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    variant: "destructive",
  },
  major_outage: {
    icon: XCircle,
    label: "Major Outage",
    color: "text-red-500",
    bgColor: "bg-red-500",
    variant: "destructive",
  },
};

const incidentStatusConfig = {
  investigating: { label: "Investigating", color: "text-yellow-500" },
  identified: { label: "Identified", color: "text-orange-500" },
  monitoring: { label: "Monitoring", color: "text-blue-500" },
  resolved: { label: "Resolved", color: "text-green-500" },
};

export default function DemoPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const overallStatus = "degraded"; // Since we have one degraded service
  const overallStatusInfo = statusConfig[overallStatus];
  const OverallIcon = overallStatusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold hover:text-primary transition-colors"
            >
              ← Back to Home
            </Link>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="text-center mt-8">
            <h1 className="text-3xl font-bold">Demo Company Status</h1>
            <p className="text-muted-foreground mt-2">
              This is a demo status page showing how Outager works
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <OverallIcon className={`h-5 w-5 ${overallStatusInfo.color}`} />
              <span
                className={`text-lg font-medium ${overallStatusInfo.color}`}
              >
                Some Services Experiencing Issues
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Call to Action Banner */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {user
                    ? "Ready to Manage Your Services?"
                    : "Create Your Own Status Page"}
                </h2>
                <p className="text-muted-foreground">
                  {user
                    ? "Go to your dashboard to start managing your services and incidents."
                    : "This is a demonstration. Sign up to create your own status page in minutes."}
                </p>
              </div>
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="flex items-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Active Incidents
          </h2>
          <div className="space-y-4">
            {demoIncidents.map((incident) => (
              <Card
                key={incident.id}
                className="border-yellow-200 dark:border-yellow-800"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{incident.title}</CardTitle>
                    <Badge variant="secondary">
                      {incidentStatusConfig[incident.status]?.label ||
                        incident.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incident.updates
                      .sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at)
                      )
                      .map((update, index) => (
                        <div
                          key={update.id}
                          className={`border-l-2 pl-4 ${
                            index === 0
                              ? "border-l-blue-500"
                              : "border-l-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(update.created_at)}
                            <span className="capitalize font-medium">
                              (
                              {incidentStatusConfig[update.status]?.label ||
                                update.status}
                              )
                            </span>
                          </div>
                          <p>{update.message}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Services Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="space-y-2">
            {demoServices.map((service) => {
              const statusInfo = statusConfig[service.status];
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={service.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={statusInfo.variant}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${statusInfo.bgColor}`}
                        />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Incidents
          </h2>
          <div className="space-y-4">
            {resolvedIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {incident.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">Resolved</Badge>
                      <span>{formatDate(incident.created_at)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Incident Timeline:</h4>
                    {incident.updates
                      .sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at)
                      )
                      .map((update, index) => (
                        <div
                          key={update.id}
                          className={`border-l-2 pl-4 ${
                            update.status === "resolved"
                              ? "border-l-green-500"
                              : index === 0
                              ? "border-l-blue-500"
                              : "border-l-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(update.created_at)}
                            <Badge
                              variant={
                                update.status === "resolved"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {incidentStatusConfig[update.status]?.label ||
                                update.status}
                            </Badge>
                          </div>
                          <p className="text-sm">{update.message}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Create Your Status Page?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join thousands of companies using Outager to keep their customers
              informed about service status and incidents.
            </p>
            <div className="flex items-center justify-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg">Start Free Trial</Button>
                  </Link>
                  <Link href="/signin">
                    <Button variant="outline" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="mb-6" />
          <p className="text-sm text-muted-foreground">
            This is a demonstration status page • Powered by Outager
          </p>
        </div>
      </main>
    </div>
  );
}
