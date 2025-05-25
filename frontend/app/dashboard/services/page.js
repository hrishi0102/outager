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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthStore from "@/store/auth-store";
import apiClient from "@/lib/api";
import { Plus, MoreHorizontal, Trash2, Activity } from "lucide-react";

const statusOptions = [
  { value: "operational", label: "Operational", color: "bg-green-500" },
  { value: "degraded", label: "Degraded Performance", color: "bg-yellow-500" },
  { value: "partial_outage", label: "Partial Outage", color: "bg-orange-500" },
  { value: "major_outage", label: "Major Outage", color: "bg-red-500" },
];

export default function ServicesPage() {
  const { organization } = useAuthStore();
  const [services, setServices] = useState([]);
  const [userRole, setUserRole] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      loadServices();
      loadUserRole();
    }
  }, [organization]);

  const loadUserRole = async () => {
    try {
      const response = await apiClient.getTeamMembers(organization.id);
      const currentUser = response.members.find(
        (member) =>
          member.profiles?.email === useAuthStore.getState().user?.email
      );
      setUserRole(currentUser?.role || "viewer");
    } catch (err) {
      console.error("Failed to load user role:", err);
      setUserRole("viewer"); // Default to most restrictive
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getServices(organization.id);
      setServices(response.services || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setFormLoading(true);
      await apiClient.createService(organization.id, formData);
      setFormData({ name: "", description: "" });
      setShowAddDialog(false);
      loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      await apiClient.updateServiceStatus(serviceId, newStatus);
      setServices(
        services.map((service) =>
          service.id === serviceId ? { ...service, status: newStatus } : service
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await apiClient.deleteService(serviceId);
      setServices(services.filter((service) => service.id !== serviceId));
    } catch (err) {
      setError(err.message);
    }
  };

  const canCreateServices = ["admin", "member"].includes(userRole);
  const canUpdateStatus = ["admin", "member"].includes(userRole);
  const canDeleteServices = userRole === "admin";

  const getStatusInfo = (status) => {
    return (
      statusOptions.find((option) => option.value === status) ||
      statusOptions[0]
    );
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
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your services and their status
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateServices}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service to monitor on your status page.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Website, API, Database"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this service..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={formLoading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading || !formData.name.trim()}
                >
                  {formLoading ? "Adding..." : "Add Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
            <p className="text-muted-foreground mt-2">
              Add your first service to start monitoring its status
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
              disabled={!canCreateServices}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => {
            const statusInfo = getStatusInfo(service.status);

            return (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {service.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${statusInfo.color}`}
                          />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Change Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canUpdateStatus}
                          >
                            Update Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {statusOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() =>
                                handleStatusChange(service.id, option.value)
                              }
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${option.color}`}
                              />
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Actions Menu */}
                      {canDeleteServices && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
