const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

// Get team members for an organization
router.get("/:organizationId/members", authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user.id;

    console.log(
      "Getting team members for org:",
      organizationId,
      "by user:",
      userId
    );

    // Check if user is a member of this organization
    const { data: userMembership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (memberError || !userMembership) {
      console.log("User not authorized:", memberError);
      return res
        .status(403)
        .json({ error: "Not authorized to view this organization's team" });
    }

    // Get all team members with their profile information
    const { data: members, error } = await supabaseAdmin
      .from("organization_members")
      .select(
        `
        id,
        role,
        created_at,
        user_id,
        profiles (
          id,
          email,
          full_name
        )
      `
      )
      .eq("organization_id", organizationId);

    if (error) {
      console.log("Error getting members:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Found members:", members?.length || 0);
    res.json({ members: members || [] });
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a team member to organization
router.post("/:organizationId/members", authenticateToken, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { email, role = "member" } = req.body;
    const userId = req.user.id;

    console.log(
      "Adding member:",
      email,
      "with role:",
      role,
      "to org:",
      organizationId
    );

    // Validate input
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if user is admin of this organization
    const { data: userMembership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (memberError || !userMembership || userMembership.role !== "admin") {
      console.log("User not admin:", memberError, userMembership);
      return res
        .status(403)
        .json({ error: "Only admins can add team members" });
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", email)
      .single();

    if (userError || !targetUser) {
      console.log("User not found:", userError);
      return res
        .status(404)
        .json({
          error:
            "User with this email not found. They need to create an account first.",
        });
    }

    console.log("Found target user:", targetUser.id);

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", targetUser.id)
      .single();

    if (existingMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of this organization" });
    }

    // Add user to organization
    const { data: newMember, error: addError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: targetUser.id,
        role: role,
      })
      .select(
        `
        id,
        role,
        created_at,
        user_id,
        profiles (
          id,
          email,
          full_name
        )
      `
      )
      .single();

    if (addError) {
      console.log("Error adding member:", addError);
      return res.status(400).json({ error: addError.message });
    }

    console.log("Member added successfully:", newMember.id);
    res.status(201).json({
      message: "Team member added successfully",
      member: newMember,
    });
  } catch (error) {
    console.error("Add team member error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update team member role
router.patch(
  "/:organizationId/members/:memberId",
  authenticateToken,
  async (req, res) => {
    try {
      const { organizationId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      console.log("Updating member role:", memberId, "to:", role);

      // Validate role
      if (!["admin", "member", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Check if user is admin of this organization
      const { data: userMembership, error: memberError } = await supabaseAdmin
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .single();

      if (memberError || !userMembership || userMembership.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can change member roles" });
      }

      // Update the member's role
      const { data: updatedMember, error: updateError } = await supabaseAdmin
        .from("organization_members")
        .update({ role })
        .eq("id", memberId)
        .eq("organization_id", organizationId)
        .select(
          `
        id,
        role,
        created_at,
        user_id,
        profiles (
          id,
          email,
          full_name
        )
      `
        )
        .single();

      if (updateError) {
        console.log("Error updating role:", updateError);
        return res.status(400).json({ error: updateError.message });
      }

      console.log("Role updated successfully");
      res.json({
        message: "Member role updated successfully",
        member: updatedMember,
      });
    } catch (error) {
      console.error("Update member role error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Remove team member from organization
router.delete(
  "/:organizationId/members/:memberId",
  authenticateToken,
  async (req, res) => {
    try {
      const { organizationId, memberId } = req.params;
      const userId = req.user.id;

      console.log("Removing member:", memberId, "from org:", organizationId);

      // Check if user is admin of this organization
      const { data: userMembership, error: memberError } = await supabaseAdmin
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .single();

      if (memberError || !userMembership || userMembership.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can remove team members" });
      }

      // Get member info before deleting
      const { data: memberToDelete, error: getMemberError } =
        await supabaseAdmin
          .from("organization_members")
          .select("user_id")
          .eq("id", memberId)
          .eq("organization_id", organizationId)
          .single();

      if (getMemberError || !memberToDelete) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Don't allow removing yourself (admin)
      if (memberToDelete.user_id === userId) {
        return res
          .status(400)
          .json({ error: "You cannot remove yourself from the organization" });
      }

      // Remove the member
      const { error: deleteError } = await supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("id", memberId)
        .eq("organization_id", organizationId);

      if (deleteError) {
        console.log("Error removing member:", deleteError);
        return res.status(400).json({ error: deleteError.message });
      }

      console.log("Member removed successfully");
      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Remove team member error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
