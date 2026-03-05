"use server";

import { supabase } from "@/lib/supabase";

export async function checkUsernameAction(username: string, currentUserId?: string) {
  if (!username) {
    return { isValid: true, message: "" };
  }

  // Basic format validation
  if (username.length < 3) {
    return {
      isValid: false,
      message: "Username must be at least 3 characters long"
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      message: "Username must be at most 20 characters long"
    };
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: "Username can only contain letters, numbers, and underscores"
    };
  }

  try {
    const { data: existingUsers, error } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", username);

    if (error) {
      console.error("Username check error:", error);
      return {
        isValid: true,
        message: "Username is available"
      };
    }

    // Check if username exists and is not the current user's username
    const usernameExists = existingUsers?.some(
      (p) => p.username.toLowerCase() === username.toLowerCase() && p.id !== currentUserId
    );

    if (usernameExists) {
      return {
        isValid: false,
        message: "Username is already taken"
      };
    } else {
      return {
        isValid: true,
        message: "Username is available"
      };
    }
  } catch (err) {
    console.error("Username validation catch error:", err);
    return {
      isValid: true,
      message: "Username is available"
    };
  }
}

export async function updateProfileAction(prevState: any, formData: FormData) {
  const currentUserId = formData.get("currentUserId") as string;
  const username = formData.get("username") as string;
  const countryId = formData.get("countryId") as string;
  const stateId = formData.get("stateId") as string;
  const cityId = formData.get("cityId") as string;

  try {
    // Re-validate everything on the server
    const validationResult = await checkUsernameAction(username, currentUserId);
    if (!validationResult.isValid) {
      return { error: validationResult.message };
    }

    if (!countryId) {
      return { error: "Please select your country" };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: username,
        country_id: countryId || null,
        state_id: stateId || null,
        city_id: cityId || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", currentUserId);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      message: "Profile updated successfully!"
    };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { error: error.message || "Failed to update profile" };
  }
}
