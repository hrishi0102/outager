const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabase");

// Sign up
router.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res
        .status(400)
        .json({ error: "Email, password and full name are required" });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "User created successfully",
      user: data.user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Sign in
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      message: "Signed in successfully",
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    res.json({ user: { ...user, profile } });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
