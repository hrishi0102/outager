"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/lib/api";
import useAuthStore from "@/store/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  LogOut,
  Settings,
} from "lucide-react";

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

export default function PublicStatusPage({ params }) {
  const resolvedParams = use(params);
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [organization, setOrganization] = useState(null);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStatusPage();
  }, [resolvedParams.slug]);

  const loadStatusPage = async () => {
    try {
      setLoading(true);

      // Load organization by slug
      const orgResponse = await apiClient.getOrganizationBySlug(
        resolvedParams.slug
      );
      setOrganization(orgResponse.organization);

      // Load services and incidents
      const [servicesResponse, incidentsResponse] = await Promise.all([
        apiClient.getServices(orgResponse.organization.id),
        apiClient.getIncidents(orgResponse.organization.id),
      ]);

      setServices(servicesResponse.services || []);
      setIncidents(incidentsResponse.incidents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const getOverallStatus = () => {
    if (services.length === 0) return "operational";

    const hasIncidents = incidents.some((i) => i.status !== "resolved");
    if (hasIncidents) return "major_outage";

    const statuses = services.map((s) => s.status);
    if (statuses.includes("major_outage")) return "major_outage";
    if (statuses.includes("partial_outage")) return "partial_outage";
    if (statuses.includes("degraded")) return "degraded";

    return "operational";
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

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const recentIncidents = incidents
    .filter((i) => i.status === "resolved")
    .slice(0, 5);
  const overallStatus = getOverallStatus();
  const overallStatusInfo = statusConfig[overallStatus];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading status page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold">
              Status Page Not Found
            </h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const OverallIcon = overallStatusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="text-xl font-bold hover:text-primary transition-colors"
            >
              Outager
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
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold">{organization?.name} Status</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <OverallIcon className={`h-5 w-5 ${overallStatusInfo.color}`} />
              <span
                className={`text-lg font-medium ${overallStatusInfo.color}`}
              >
                {overallStatus === "operational"
                  ? "All Systems Operational"
                  : "System Issues Detected"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Active Incidents
            </h2>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className="border-red-200 dark:border-red-800"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {incident.title}
                      </CardTitle>
                      <Badge variant="destructive">
                        {incidentStatusConfig[incident.status]?.label ||
                          incident.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {incident.incident_updates &&
                      incident.incident_updates.length > 0 && (
                        <div className="space-y-3">
                          {incident.incident_updates
                            .sort(
                              (a, b) =>
                                new Date(b.created_at) - new Date(a.created_at)
                            )
                            .map((update, index) => (
                              <div
                                key={update.id}
                                className={
                                  index === 0
                                    ? "border-l-2 border-red-500 pl-4"
                                    : "border-l-2 border-gray-300 pl-4"
                                }
                              >
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Clock className="h-4 w-4" />
                                  {formatDate(update.created_at)}
                                  <span className="capitalize font-medium">
                                    (
                                    {incidentStatusConfig[update.status]
                                      ?.label || update.status}
                                    )
                                  </span>
                                </div>
                                <p>{update.message}</p>
                              </div>
                            ))}
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Services Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          {services.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No services configured yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {services.map((service) => {
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
                          <StatusIcon
                            className={`h-5 w-5 ${statusInfo.color}`}
                          />
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">
                                {service.description}
                              </p>
                            )}
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
          )}
        </div>

        {/* Incident History */}
        {recentIncidents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Incidents
            </h2>
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
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
                    {/* Show full incident timeline for resolved incidents */}
                    {incident.incident_updates &&
                      incident.incident_updates.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">
                            Incident Timeline:
                          </h4>
                          {incident.incident_updates
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
                                    {incidentStatusConfig[update.status]
                                      ?.label || update.status}
                                  </Badge>
                                </div>
                                <p className="text-sm">{update.message}</p>
                              </div>
                            ))}
                        </div>
                      )}

                    {/* Show affected services if any */}
                    {incident.incident_services &&
                      incident.incident_services.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <h4 className="font-medium text-sm mb-2">
                            Affected Services:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {incident.incident_services.map((serviceLink) => (
                              <Badge
                                key={serviceLink.service_id}
                                variant="outline"
                                className="text-xs"
                              >
                                {serviceLink.services?.name ||
                                  "Unknown Service"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="mb-6" />
          <p className="text-sm text-muted-foreground">
            Powered by Outager • Updated {new Date().toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
}
