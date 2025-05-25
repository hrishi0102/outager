const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

// Middleware to check organization membership
const checkOrgMember = async (req, res, next) => {
  const { organizationId } = req.params;
  const userId = req.user.id;

  const { data, error } = await supabaseAdmin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return res.status(403).json({ error: "Not a member of this organization" });
  }

  req.userRole = data.role;
  next();
};

// Get all services for an organization (public)
router.get("/organization/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("organization_id", organizationId)
      .order("display_order", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ services: data });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/:organizationId",
  authenticateToken,
  checkOrgMember,
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { name, description } = req.body;

      // Admins and members can create services
      if (!["admin", "member"].includes(req.userRole)) {
        return res
          .status(403)
          .json({ error: "Only admins and members can create services" });
      }

      const { data, error } = await supabaseAdmin
        .from("services")
        .insert({
          organization_id: organizationId,
          name,
          description,
          status: "operational",
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ service: data });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.patch(":serviceId/status", authenticateToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log("Update service request:", { serviceId, status, userId });

    // First, get the service to find its organization
    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("*, organization_id")
      .eq("id", serviceId)
      .single();

    console.log("Service lookup:", { service, serviceError });

    if (serviceError || !service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Check if user is a member of the organization
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", service.organization_id)
      .eq("user_id", userId)
      .single();

    console.log("Membership lookup:", {
      organization_id: service.organization_id,
      user_id: userId,
      membership,
      memberError,
    });

    if (memberError || !membership) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this service" });
    }

    // Validate status
    const validStatuses = [
      "operational",
      "degraded",
      "partial_outage",
      "major_outage",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update the service status
    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from("services")
      .update({ status })
      .eq("id", serviceId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ service: updatedService });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update the delete route similarly
router.delete("/:serviceId", authenticateToken, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user.id;

    // Get service first
    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("organization_id")
      .eq("id", serviceId)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Check if user is admin
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", service.organization_id)
      .eq("user_id", userId)
      .single();

    if (memberError || !membership || membership.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete services" });
    }

    // Delete the service
    const { error: deleteError } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Debug route - REMOVE IN PRODUCTION
router.get("/debug/:serviceId", authenticateToken, async (req, res) => {
  const { serviceId } = req.params;
  const userId = req.user.id;

  // Get service
  const { data: service } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .single();

  // Get all memberships for this user
  const { data: memberships } = await supabaseAdmin
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", userId);

  // Get specific membership if service exists
  let specificMembership = null;
  if (service) {
    const { data } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", service.organization_id)
      .eq("user_id", userId)
      .single();
    specificMembership = data;
  }

  res.json({
    userId,
    serviceId,
    service,
    allUserMemberships: memberships,
    specificMembership,
  });
});

module.exports = router;
