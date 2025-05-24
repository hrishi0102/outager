const { supabaseAdmin } = require("../config/supabase");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = { authenticateToken };
