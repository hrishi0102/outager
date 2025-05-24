const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

// Create organization
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }

    // Create slug from name
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if slug exists and make it unique if needed
    let slugExists = true;
    let slugCounter = 0;
    let finalSlug = slug;

    while (slugExists) {
      const { data: existing } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();

      if (!existing) {
        slugExists = false;
      } else {
        slugCounter++;
        finalSlug = `${slug}-${slugCounter}`;
      }
    }

    // Start a transaction-like operation
    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name,
        slug: finalSlug,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Org creation error:", orgError);
      return res.status(400).json({ error: "Failed to create organization" });
    }

    // Add user as admin
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: "admin",
      })
      .select()
      .single();

    if (memberError) {
      // Rollback - delete the organization
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);

      console.error("Member creation error:", memberError);
      return res
        .status(400)
        .json({ error: "Failed to add user to organization" });
    }

    res.status(201).json({
      organization: org,
      membership: membership,
    });
  } catch (error) {
    console.error("Create org error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's organizations
router.get("/my-organizations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .select(
        `
        role,
        created_at,
        organizations (
          id,
          name,
          slug,
          created_at
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Get orgs error:", error);
      return res.status(400).json({ error: error.message });
    }

    const organizations = data.map((item) => ({
      ...item.organizations,
      role: item.role,
      joined_at: item.created_at,
    }));

    res.json({ organizations });
  } catch (error) {
    console.error("Get orgs error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get organization by slug (public)
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({ organization: data });
  } catch (error) {
    console.error("Get org by slug error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
