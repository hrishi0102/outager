"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useAuthStore from "@/store/auth-store";
import apiClient from "@/lib/api";
import { Server, AlertCircle, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, organization, setOrganization } = useAuthStore();
  const [organizations, setOrganizations] = useState([]);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [createOrgLoading, setCreateOrgLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user's organizations
      const orgsResponse = await apiClient.getMyOrganizations();
      setOrganizations(orgsResponse.organizations);

      // If user has no organization, they need to create one
      if (orgsResponse.organizations.length === 0) {
        setLoading(false);
        return;
      }

      // Set first organization as active (for now)
      const firstOrg = orgsResponse.organizations[0];
      setOrganization(firstOrg);

      // Load services and incidents for the organization
      const [servicesResponse, incidentsResponse] = await Promise.all([
        apiClient.getServices(firstOrg.id),
        apiClient.getIncidents(firstOrg.id),
      ]);

      setServices(servicesResponse.services || []);
      setIncidents(incidentsResponse.incidents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) return;

    try {
      setCreateOrgLoading(true);
      const response = await apiClient.createOrganization(orgName);
      setOrganization(response.organization);
      setShowCreateOrgDialog(false);
      setOrgName("");
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateOrgLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "partial_outage":
        return "bg-orange-500";
      case "major_outage":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded";
      case "partial_outage":
        return "Partial Outage";
      case "major_outage":
        return "Major Outage";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show organization creation if user has no organizations
  if (organizations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Outager!</CardTitle>
            <CardDescription>
              Let's get started by creating your first organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              An organization helps you manage your services and status pages.
              You can invite team members and manage multiple services under one
              organization.
            </p>

            <Dialog
              open={showCreateOrgDialog}
              onOpenChange={setShowCreateOrgDialog}
            >
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Choose a name for your organization. This will be used in
                    your status page URL.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      placeholder="e.g., Acme Inc, My Company"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={createOrgLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && orgName.trim()) {
                          handleCreateOrganization();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateOrgDialog(false);
                        setOrgName("");
                      }}
                      disabled={createOrgLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateOrganization}
                      disabled={createOrgLoading || !orgName.trim()}
                    >
                      {createOrgLoading ? "Creating..." : "Create Organization"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  const operationalServices = services.filter(
    (s) => s.status === "operational"
  ).length;
  const totalServices = services.length;
  const activeIncidents = incidents.filter(
    (i) => i.status !== "resolved"
  ).length;

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {organization?.name || "Your Organization"}
          </p>
        </div>

        {organization && (
          <div className="flex items-center gap-2">
            <Link href={`/${organization.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Page
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Service Status
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {operationalServices}/{totalServices}
            </div>
            <p className="text-xs text-muted-foreground">
              services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground">incidents ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Status
            </CardTitle>
            <div
              className={`w-3 h-3 rounded-full ${
                activeIncidents === 0 && operationalServices === totalServices
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeIncidents === 0 && operationalServices === totalServices
                ? "All Good"
                : "Issues"}
            </div>
            <p className="text-xs text-muted-foreground">system status</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Services Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Services</CardTitle>
            <Link href="/dashboard/services">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No services yet. Add your first service to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {services.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{service.name}</span>
                    <Badge variant="outline" className="text-xs">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(
                          service.status
                        )}`}
                      />
                      {getStatusText(service.status)}
                    </Badge>
                  </div>
                ))}
                {services.length > 5 && (
                  <Link
                    href="/dashboard/services"
                    className="block text-center"
                  >
                    <Button variant="ghost" size="sm">
                      View all {services.length} services
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Incidents</CardTitle>
            <Link href="/dashboard/incidents">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No incidents. Great job keeping things running smoothly!
              </p>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {incident.title}
                      </span>
                      <Badge
                        variant={
                          incident.status === "resolved"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {incidents.length > 5 && (
                  <Link
                    href="/dashboard/incidents"
                    className="block text-center"
                  >
                    <Button variant="ghost" size="sm">
                      View all incidents
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
