"use server";

import { createClient } from "@/lib/supabase-server";

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
    const supabase = await createClient();
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
  const countryIdRaw = formData.get("countryId") as string;
  const stateIdRaw = formData.get("stateId") as string;
  const cityIdRaw = formData.get("cityId") as string;

  console.log("🔥 Server Action - Raw FormData:", {
    currentUserId,
    username,
    countryIdRaw,
    stateIdRaw,
    cityIdRaw
  });

  // Parse numeric IDs (DB columns are integer, formData sends strings)
  const countryId = countryIdRaw && countryIdRaw !== "" ? parseInt(countryIdRaw, 10) : null;
  const stateId = stateIdRaw && stateIdRaw !== "" ? parseInt(stateIdRaw, 10) : null;
  const cityId = cityIdRaw && cityIdRaw !== "" ? parseInt(cityIdRaw, 10) : null;

  console.log("🔥 Server Action - Parsed IDs:", { countryId, stateId, cityId });

  try {
    // Re-validate everything on the server
    const validationResult = await checkUsernameAction(username, currentUserId);
    if (!validationResult.isValid) {
      return { error: validationResult.message };
    }

    if (!countryId) {
      console.log("🔥 Server Action - countryId is falsy, returning error");
      return { error: "Please select your country" };
    }

    const supabase = await createClient();

    const updateData = {
      username: username,
      country_id: countryId,
      state_id: stateId,
      city_id: cityId,
      updated_at: new Date().toISOString()
    };

    console.log("🔥 Server Action - Update data:", updateData);
    console.log("🔥 Server Action - Updating profile with id:", currentUserId);

    const { data: updateResult, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", currentUserId)
      .select("id, username, country_id, state_id, city_id");

    if (updateError) {
      console.error("🔥 Server Action - Update error:", updateError);
      throw updateError;
    }

    console.log("🔥 Server Action - Update result:", updateResult);

    if (!updateResult || updateResult.length === 0) {
      console.error("🔥 Server Action - No rows updated! RLS may be blocking the update.");
      return { error: "Failed to update profile. Please try again." };
    }

    return {
      success: true,
      message: "Profile updated successfully!"
    };
  } catch (error: any) {
    console.error("🔥 Server Action - Error:", error);
    return { error: error.message || "Failed to update profile" };
  }
}
