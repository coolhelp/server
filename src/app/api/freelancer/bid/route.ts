import { NextRequest, NextResponse } from "next/server";
import type { BidProposal } from "@/types";

const FREELANCER_API_BASE = "https://www.freelancer.com/api";
const FREELANCER_SANDBOX_BASE = "https://www.freelancer-sandbox.com/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bid, accessToken, sandbox } = body as {
      bid: BidProposal;
      accessToken: string;
      sandbox?: boolean;
    };

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 401 }
      );
    }

    if (!bid.projectId || !bid.amount || !bid.period) {
      return NextResponse.json(
        { error: "Project ID, amount, and period are required" },
        { status: 400 }
      );
    }

    const baseUrl = sandbox ? FREELANCER_SANDBOX_BASE : FREELANCER_API_BASE;

    // Prepare bid data for Freelancer API
    const bidData: any = {
      project_id: parseInt(bid.projectId),
      bidder_id: 0, // Will be filled by API based on authenticated user
      amount: bid.amount,
      period: bid.period,
      milestone_percentage: 100,
      description: bid.coverLetter,
    };

    // Add screening question answers if available
    if (bid.answers && bid.answers.length > 0) {
      bidData.hireme_initial_answers = bid.answers.map((a) => a.answer);
    }

    const response = await fetch(`${baseUrl}/projects/0.1/bids/`, {
      method: "POST",
      headers: {
        "Freelancer-OAuth-V1": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bidData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.message || "Failed to submit bid",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      bidId: data.result?.id,
      message: "Bid submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting bid:", error);
    return NextResponse.json(
      { error: "Failed to submit bid to Freelancer" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get user's bids
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
    const sandbox = searchParams.get("sandbox") === "true";
    const projectId = searchParams.get("project_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 401 }
      );
    }

    const baseUrl = sandbox ? FREELANCER_SANDBOX_BASE : FREELANCER_API_BASE;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      bidders: "true",
      project_details: "true",
    });

    if (projectId) {
      params.append("project_ids[]", projectId);
    }

    const response = await fetch(
      `${baseUrl}/projects/0.1/bids?${params.toString()}`,
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
        { error: errorData.message || "Failed to fetch bids" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const bids = (data.result?.bids || []).map((bid: any) => ({
      id: bid.id?.toString(),
      projectId: bid.project_id?.toString(),
      amount: bid.amount,
      period: bid.period,
      coverLetter: bid.description,
      status: mapBidStatus(bid.award_status),
      createdAt: bid.time_submitted
        ? new Date(bid.time_submitted * 1000).toISOString()
        : new Date().toISOString(),
      submittedAt: bid.time_submitted
        ? new Date(bid.time_submitted * 1000).toISOString()
        : undefined,
    }));

    return NextResponse.json({
      bids,
      total: data.result?.total_count || bids.length,
    });
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids from Freelancer" },
      { status: 500 }
    );
  }
}

function mapBidStatus(awardStatus: string): BidProposal["status"] {
  switch (awardStatus) {
    case "awarded":
      return "accepted";
    case "rejected":
      return "rejected";
    case "pending":
    default:
      return "submitted";
  }
}

