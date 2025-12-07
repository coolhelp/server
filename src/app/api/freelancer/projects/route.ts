import { NextRequest, NextResponse } from "next/server";
import type { FreelancerProject } from "@/types";

const FREELANCER_API_BASE = "https://www.freelancer.com/api";
const FREELANCER_SANDBOX_BASE = "https://www.freelancer-sandbox.com/api";

interface FreelancerAPIConfig {
  accessToken: string;
  sandbox?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
    const sandbox = searchParams.get("sandbox") === "true";
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 401 }
      );
    }

    const skills = searchParams.get("skills")?.split(",") || [];
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const baseUrl = sandbox ? FREELANCER_SANDBOX_BASE : FREELANCER_API_BASE;
    
    // Build query parameters for Freelancer API
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      project_types: "fixed,hourly",
      full_description: "true",
      job_details: "true",
      user_details: "true",
      user_status: "true",
    });

    if (skills.length > 0) {
      params.append("jobs[]", skills.join(","));
    }

    const response = await fetch(
      `${baseUrl}/projects/0.1/projects/active?${params.toString()}`,
      {
        headers: {
          "Freelancer-OAuth-V1": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch projects" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform Freelancer API response to our format
    const projects: FreelancerProject[] = (data.result?.projects || []).map(
      (project: any) => transformProject(project)
    );

    return NextResponse.json({
      projects,
      total: data.result?.total_count || projects.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects from Freelancer" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Fetch a single project by URL or ID
  try {
    const body = await request.json();
    const { projectUrl, projectId, accessToken, sandbox } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 401 }
      );
    }

    let id = projectId;
    
    // Extract project ID from URL if provided
    if (projectUrl && !id) {
      const match = projectUrl.match(/projects\/[^/]+\/(\d+)/);
      if (match) {
        id = match[1];
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Project ID or URL is required" },
        { status: 400 }
      );
    }

    const baseUrl = sandbox ? FREELANCER_SANDBOX_BASE : FREELANCER_API_BASE;

    const response = await fetch(
      `${baseUrl}/projects/0.1/projects/${id}?full_description=true&job_details=true&user_details=true`,
      {
        headers: {
          "Freelancer-OAuth-V1": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch project" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const project = transformProject(data.result);

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project from Freelancer" },
      { status: 500 }
    );
  }
}

function transformProject(apiProject: any): FreelancerProject {
  return {
    id: apiProject.id?.toString() || "",
    title: apiProject.title || "",
    description: apiProject.description || apiProject.preview_description || "",
    budget: {
      min: apiProject.budget?.minimum || 0,
      max: apiProject.budget?.maximum || 0,
      currency: apiProject.currency?.code || "USD",
    },
    skills: (apiProject.jobs || []).map((job: any) => job.name || job),
    type: apiProject.type === "fixed" ? "fixed" : "hourly",
    status: apiProject.status === "active" ? "open" : "closed",
    bidCount: apiProject.bid_stats?.bid_count || 0,
    averageBid: apiProject.bid_stats?.bid_avg || undefined,
    deadline: apiProject.time_submitted
      ? new Date(apiProject.time_submitted * 1000).toISOString()
      : undefined,
    questions: (apiProject.hireme_initial_questions || []).map(
      (q: any, idx: number) => ({
        id: `q${idx + 1}`,
        question: typeof q === "string" ? q : q.question || "",
        isRequired: true,
      })
    ),
    postedAt: apiProject.time_submitted
      ? new Date(apiProject.time_submitted * 1000).toISOString()
      : new Date().toISOString(),
    clientCountry: apiProject.owner?.location?.country?.name,
    clientRating: apiProject.owner?.reputation?.overall,
    clientReviews: apiProject.owner?.reputation?.entire_history?.all,
    url: `https://www.freelancer.com/projects/${apiProject.seo_url}/${apiProject.id}`,
  };
}

