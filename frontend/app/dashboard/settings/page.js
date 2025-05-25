"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuthStore from "@/store/auth-store";
import apiClient from "@/lib/api";
import {
  ExternalLink,
  Copy,
  Check,
  Plus,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, organization } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // Team management state
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  const publicUrl = organization
    ? `${window.location.origin}/${organization.slug}`
    : "";

  // Load team members when organization changes
  useEffect(() => {
    if (organization) {
      loadTeamMembers();
    }
  }, [organization]);

  const loadTeamMembers = async () => {
    try {
      setTeamLoading(true);
      setTeamError("");
      const response = await apiClient.getTeamMembers(organization.id);
      setTeamMembers(response.members || []);
    } catch (err) {
      setTeamError(err.message);
      console.error("Error loading team members:", err);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      setAddMemberLoading(true);
      setTeamError("");
      await apiClient.addTeamMember(
        organization.id,
        newMemberEmail,
        newMemberRole
      );

      // Reset form
      setNewMemberEmail("");
      setNewMemberRole("member");
      setShowAddMemberDialog(false);

      // Reload team members
      loadTeamMembers();
    } catch (err) {
      setTeamError(err.message);
      console.error("Error adding team member:", err);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      setTeamError("");
      await apiClient.updateMemberRole(organization.id, memberId, newRole);
      loadTeamMembers(); // Reload team members
    } catch (err) {
      setTeamError(err.message);
      console.error("Error updating role:", err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      setTeamError("");
      await apiClient.removeTeamMember(organization.id, memberId);
      loadTeamMembers(); // Reload team members
    } catch (err) {
      setTeamError(err.message);
      console.error("Error removing member:", err);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "default";
      case "member":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "member":
        return "Member";
      case "viewer":
        return "Viewer";
      default:
        return role;
    }
  };

  // Find current user's membership to check if they're admin
  const currentUserMembership = teamMembers.find(
    (member) => member.profiles?.id === user?.id
  );
  const isCurrentUserAdmin = currentUserMembership?.role === "admin";

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
          Manage your organization settings and team
        </p>
      </div>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
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
                  Share this URL with your users to show them your service
                  status
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={user?.user_metadata?.full_name || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Account settings are managed through your authentication
                  provider. Contact support if you need to update your
                  information.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Team Management Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage who has access to your organization
                  </CardDescription>
                </div>
                {isCurrentUserAdmin && (
                  <Dialog
                    open={showAddMemberDialog}
                    onOpenChange={setShowAddMemberDialog}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Add an existing user to your organization by their
                          email address.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddMember} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            disabled={addMemberLoading}
                          />
                          <p className="text-sm text-muted-foreground">
                            User must already have an account
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={newMemberRole}
                            onValueChange={setNewMemberRole}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                Viewer - Read only access
                              </SelectItem>
                              <SelectItem value="member">
                                Member - Can manage services & incidents
                              </SelectItem>
                              <SelectItem value="admin">
                                Admin - Full access
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddMemberDialog(false);
                              setNewMemberEmail("");
                              setNewMemberRole("member");
                            }}
                            disabled={addMemberLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              addMemberLoading || !newMemberEmail.trim()
                            }
                          >
                            {addMemberLoading ? "Adding..." : "Add Member"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {teamError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{teamError}</AlertDescription>
                </Alert>
              )}

              {teamLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading team members...
                  </p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No team members yet
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Add team members to collaborate on your status page
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.profiles?.full_name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              member.profiles?.email
                                ?.charAt(0)
                                ?.toUpperCase() ||
                              "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.full_name || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>

                        {isCurrentUserAdmin &&
                          member.profiles?.id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, "admin")
                                  }
                                  disabled={member.role === "admin"}
                                >
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, "member")
                                  }
                                  disabled={member.role === "member"}
                                >
                                  Make Member
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, "viewer")
                                  }
                                  disabled={member.role === "viewer"}
                                >
                                  Make Viewer
                                </DropdownMenuItem>
                                <Separator />
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
