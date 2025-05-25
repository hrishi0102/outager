const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");
const {
  broadcastIncidentCreated,
  broadcastIncidentUpdated,
} = require("../websocket");

// Get incidents for organization (public)
router.get("/organization/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("incidents")
      .select(
        `
        *,
        incident_updates (
          id,
          message,
          status,
          created_at
        ),
        incident_services (
          service_id,
          services (
            id,
            name
          )
        )
      `
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ incidents: data });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Create incident WITH WEBSOCKET BROADCAST
router.post("/:organizationId", authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { title, message, affectedServices } = req.body;
    const userId = req.user.id;

    // Start transaction
    const { data: incident, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .insert({
        organization_id: organizationId,
        title,
        status: "investigating",
        created_by: userId,
      })
      .select()
      .single();

    if (incidentError) {
      return res.status(400).json({ error: incidentError.message });
    }

    // Create first update
    const { error: updateError } = await supabaseAdmin
      .from("incident_updates")
      .insert({
        incident_id: incident.id,
        message,
        status: "investigating",
        created_by: userId,
      });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Link affected services
    if (affectedServices && affectedServices.length > 0) {
      const serviceLinks = affectedServices.map((serviceId) => ({
        incident_id: incident.id,
        service_id: serviceId,
      }));

      const { error: linkError } = await supabaseAdmin
        .from("incident_services")
        .insert(serviceLinks);

      if (linkError) {
        return res.status(400).json({ error: linkError.message });
      }
    }

    // Get full incident data with related info for broadcast
    const { data: fullIncident } = await supabaseAdmin
      .from("incidents")
      .select(
        `
        *,
        incident_updates (
          id,
          message,
          status,
          created_at
        ),
        incident_services (
          service_id,
          services (
            id,
            name
          )
        )
      `
      )
      .eq("id", incident.id)
      .single();

    // BROADCAST INCIDENT CREATED VIA WEBSOCKET
    broadcastIncidentCreated(organizationId, fullIncident);

    res.status(201).json({ incident });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add incident update WITH WEBSOCKET BROADCAST
router.post(
  "/:organizationId/:incidentId/updates",
  authenticateToken,
  async (req, res) => {
    try {
      const { organizationId, incidentId } = req.params;
      const { message, status } = req.body;
      const userId = req.user.id;

      // Add update
      const { data: update, error: updateError } = await supabaseAdmin
        .from("incident_updates")
        .insert({
          incident_id: incidentId,
          message,
          status,
          created_by: userId,
        })
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      // Update incident status
      const { error: incidentError } = await supabaseAdmin
        .from("incidents")
        .update({
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", incidentId);

      if (incidentError) {
        return res.status(400).json({ error: incidentError.message });
      }

      // Get full incident data for broadcast
      const { data: fullIncident } = await supabaseAdmin
        .from("incidents")
        .select(
          `
          *,
          incident_updates (
            id,
            message,
            status,
            created_at
          ),
          incident_services (
            service_id,
            services (
              id,
              name
            )
          )
        `
        )
        .eq("id", incidentId)
        .single();

      // BROADCAST INCIDENT UPDATED VIA WEBSOCKET
      broadcastIncidentUpdated(organizationId, fullIncident);

      res.json({ update });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
