import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Load profile from database
export async function GET() {
  try {
    let profile = await prisma.profile.findFirst();
    
    if (!profile) {
      // Create default profile if none exists
      profile = await prisma.profile.create({
        data: {
          name: "",
          bio: "",
          experience: "",
          skills: "[]",
          hourlyRate: 50,
        },
      });
    }

    return NextResponse.json({
      name: profile.name,
      bio: profile.bio,
      experience: profile.experience,
      skills: JSON.parse(profile.skills || "[]"),
      hourlyRate: profile.hourlyRate,
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

// POST - Save profile to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, bio, experience, skills, hourlyRate } = body;

    let profile = await prisma.profile.findFirst();

    if (profile) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          name: name ?? profile.name,
          bio: bio ?? profile.bio,
          experience: experience ?? profile.experience,
          skills: skills ? JSON.stringify(skills) : profile.skills,
          hourlyRate: hourlyRate ?? profile.hourlyRate,
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          name: name || "",
          bio: bio || "",
          experience: experience || "",
          skills: JSON.stringify(skills || []),
          hourlyRate: hourlyRate || 50,
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: profile.name,
        bio: profile.bio,
        experience: profile.experience,
        skills: JSON.parse(profile.skills || "[]"),
        hourlyRate: profile.hourlyRate,
      },
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

