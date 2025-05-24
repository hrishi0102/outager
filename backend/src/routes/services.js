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

// Create service
router.post(
  "/:organizationId",
  authenticateToken,
  checkOrgMember,
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { name, description } = req.body;

      // Only admins can create services
      if (req.userRole !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can create services" });
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

// Update service status
router.patch(
  "/:organizationId/:serviceId/status",
  authenticateToken,
  checkOrgMember,
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { status } = req.body;

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

      const { data, error } = await supabaseAdmin
        .from("services")
        .update({ status })
        .eq("id", serviceId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ service: data });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete service
router.delete(
  "/:organizationId/:serviceId",
  authenticateToken,
  checkOrgMember,
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      // Only admins can delete services
      if (req.userRole !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can delete services" });
      }

      const { error } = await supabaseAdmin
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
