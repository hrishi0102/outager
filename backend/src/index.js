const supabase = require("./config/supabase");

async function deleteAllUsers() {
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  for (const user of users) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id
    );
    if (deleteError) {
      console.error(`Failed to delete ${user.email}:`, deleteError);
    } else {
      console.log(`Deleted: ${user.email}`);
    }
  }
}

deleteAllUsers();
