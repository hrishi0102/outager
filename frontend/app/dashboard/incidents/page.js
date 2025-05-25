"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAuthStore from "@/store/auth-store";
import apiClient from "@/lib/api";
import { Plus, AlertCircle, Clock, CheckCircle } from "lucide-react";

const incidentStatuses = [
  { value: "investigating", label: "Investigating", color: "bg-yellow-500" },
  { value: "identified", label: "Identified", color: "bg-orange-500" },
  { value: "monitoring", label: "Monitoring", color: "bg-blue-500" },
  { value: "resolved", label: "Resolved", color: "bg-green-500" },
];

export default function IncidentsPage() {
  const { organization } = useAuthStore();
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Create incident form
  const [createForm, setCreateForm] = useState({
    title: "",
    message: "",
    affectedServices: [],
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Update incident form
  const [updateForm, setUpdateForm] = useState({
    message: "",
    status: "investigating",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentsResponse, servicesResponse] = await Promise.all([
        apiClient.getIncidents(organization.id),
        apiClient.getServices(organization.id),
      ]);

      setIncidents(incidentsResponse.incidents || []);
      setServices(servicesResponse.services || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.message.trim()) return;

    try {
      setCreateLoading(true);
      await apiClient.createIncident(organization.id, createForm);
      setCreateForm({ title: "", message: "", affectedServices: [] });
      setShowCreateDialog(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    if (!updateForm.message.trim() || !selectedIncident) return;

    try {
      setUpdateLoading(true);
      await apiClient.addIncidentUpdate(
        organization.id,
        selectedIncident.id,
        updateForm
      );
      setUpdateForm({ message: "", status: "investigating" });
      setShowUpdateDialog(false);
      setSelectedIncident(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleServiceSelection = (serviceId, checked) => {
    setCreateForm((prev) => ({
      ...prev,
      affectedServices: checked
        ? [...prev.affectedServices, serviceId]
        : prev.affectedServices.filter((id) => id !== serviceId),
    }));
  };

  const openUpdateDialog = (incident) => {
    setSelectedIncident(incident);
    setUpdateForm({
      message: "",
      status: incident.status,
    });
    setShowUpdateDialog(true);
  };

  const getStatusInfo = (status) => {
    return (
      incidentStatuses.find((s) => s.value === status) || incidentStatuses[0]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incidents</h1>
          <p className="text-muted-foreground mt-1">
            Report and manage service incidents
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>
                Create a new incident report to inform users about service
                issues.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  disabled={createLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Initial Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe what's happening and what you're doing about it..."
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, message: e.target.value })
                  }
                  disabled={createLoading}
                  rows={4}
                />
              </div>

              {services.length > 0 && (
                <div className="space-y-2">
                  <Label>Affected Services</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={createForm.affectedServices.includes(
                            service.id
                          )}
                          onCheckedChange={(checked) =>
                            handleServiceSelection(service.id, checked)
                          }
                        />
                        <Label
                          htmlFor={`service-${service.id}`}
                          className="text-sm"
                        >
                          {service.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createLoading ||
                    !createForm.title.trim() ||
                    !createForm.message.trim()
                  }
                >
                  {createLoading ? "Creating..." : "Create Incident"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Active Incidents ({activeIncidents.length})
          </h2>
          <div className="space-y-4">
            {activeIncidents.map((incident) => {
              const statusInfo = getStatusInfo(incident.status);
              return (
                <Card key={incident.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {incident.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${statusInfo.color}`}
                          />
                          {statusInfo.label}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateDialog(incident)}
                        >
                          Add Update
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Started {formatDate(incident.created_at)}
                    </CardDescription>
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
                            .slice(0, 3)
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
                                  <Clock className="h-3 w-3" />
                                  {formatDate(update.created_at)}
                                  <span className="capitalize">
                                    ({update.status})
                                  </span>
                                </div>
                                <p className="text-sm">{update.message}</p>
                              </div>
                            ))}
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved Incidents */}
      {resolvedIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Resolved Incidents
          </h2>
          <div className="space-y-4">
            {resolvedIncidents.slice(0, 10).map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {incident.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">Resolved</Badge>
                      <span>
                        {formatDate(
                          incident.resolved_at || incident.created_at
                        )}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {incidents.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-semibold">
              No incidents reported
            </h3>
            <p className="text-muted-foreground mt-2">
              Great! All systems are running smoothly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Update Incident Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Incident Update</DialogTitle>
            <DialogDescription>{selectedIncident?.title}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateIncident} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateForm.status}
                onValueChange={(value) =>
                  setUpdateForm({ ...updateForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {incidentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-message">Update Message *</Label>
              <Textarea
                id="update-message"
                placeholder="What's the latest update on this incident?"
                value={updateForm.message}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, message: e.target.value })
                }
                disabled={updateLoading}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpdateDialog(false)}
                disabled={updateLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLoading || !updateForm.message.trim()}
              >
                {updateLoading ? "Adding..." : "Add Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading incidents...</p>
        </div>
      )}
    </div>
  );
}
