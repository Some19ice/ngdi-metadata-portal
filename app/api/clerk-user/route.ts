"use server"

import { clerkClient, auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { hasPermission } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const canViewUsers = await hasPermission(currentUserId, "view", "users")
  if (!canViewUsers) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to view user details." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get("userId")

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(targetUserId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return only necessary and safe information
    // Avoid exposing sensitive details
    const userDataToReturn = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      publicMetadata: user.publicMetadata
      // Do NOT return privateMetadata or unsafeMetadata unless absolutely necessary and secured
    }

    return NextResponse.json(userDataToReturn)
  } catch (error) {
    console.error(`Error fetching user ${targetUserId} from Clerk:`, error)
    // Check for specific Clerk errors if needed, e.g., user not found
    // if (error.status === 404) { // Example, actual error structure might differ
    //   return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    // }
    return NextResponse.json(
      { error: "Failed to fetch user data from Clerk" },
      { status: 500 }
    )
  }
}
