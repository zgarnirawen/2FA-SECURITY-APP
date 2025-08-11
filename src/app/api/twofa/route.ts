import {
  delete2fa,
  generate2fa,
  getTwofaByUserId,
  verify2fa,
} from "@/lib/actions/twofa";
import { error_response, success_response, validateToken } from "@/lib/utils";

// Helper function to validate token and extract userId
async function validateUserToken(req: Request) {
  const token = req.headers.get("Authorization");
  
  if (!token) {
    throw new Error("Authorization token is required");
  }

  let validatedToken;
  try {
    validatedToken = await validateToken(token);
  } catch (tokenError) {
    console.error("Token validation error:", tokenError);
    throw new Error("Invalid or expired token");
  }
  
  if (!validatedToken || !validatedToken.userId) {
    throw new Error("Invalid token: missing user ID");
  }

  return validatedToken.userId;
}

//NOTE: Generate2fa
export async function POST(req: Request) {
  try {
    console.log("Generating 2FA for user");
    
    const userId = await validateUserToken(req);
    
    console.log("Generating 2FA for user ID:", userId);
    
    const twofa = await generate2fa(userId);
    
    if (!twofa) {
      return error_response("Failed to generate 2FA", 500);
    }

    // Don't log sensitive 2FA data
    console.log("2FA generated successfully for user:", userId);
    
    return success_response(twofa, "2FA generated successfully", 201);
    
  } catch (err) {
    console.error("POST /api/twofa error:", err);
    
    // Handle specific error types
    if ((err as any)?.message?.includes("token")) {
      return error_response((err as any).message, 401);
    }
    
    if ((err as any)?.code === 'P2002') { // Prisma unique constraint
      return error_response("2FA already exists for this user", 409);
    }
    
    if ((err as any)?.name === 'DatabaseError') {
      return error_response("Database operation failed", 500);
    }
    
    return error_response(
      (err as any)?.message || "Failed to generate 2FA", 
      500
    );
  }
}

//NOTE: Verify2fa
export async function PUT(req: Request) {
  try {
    console.log("Verifying 2FA token");
    
    const userId = await validateUserToken(req);
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return error_response("Invalid JSON in request body", 400);
    }

    // Validate request body
    if (!body || typeof body !== 'object') {
      return error_response("Request body must be a valid JSON object", 400);
    }

    const { token: twofaToken } = body;

    if (!twofaToken) {
      return error_response("2FA token is required", 400);
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(twofaToken)) {
      return error_response("2FA token must be 6 digits", 400);
    }

    console.log("Verifying 2FA for user ID:", userId);
    
    const twofa = await verify2fa(userId, twofaToken);
    
    if (!twofa) {
      return error_response("Invalid or expired 2FA token", 401);
    }

    console.log("2FA verified successfully for user:", userId);
    
    return success_response(twofa, "2FA verified successfully", 200);
    
  } catch (err) {
    console.error("PUT /api/twofa error:", err);
    
    // Handle specific error types
    if ((err as any)?.message?.includes("token")) {
      return error_response((err as any).message, 401);
    }
    
    if ((err as any)?.message?.includes("Invalid") || (err as any)?.message?.includes("expired")) {
      return error_response("Invalid or expired 2FA token", 401);
    }
    
    if ((err as any)?.code === 'P2025') { // Record not found
      return error_response("2FA not found for this user", 404);
    }
    
    return error_response(
      (err as any)?.message || "2FA verification failed", 
      400
    );
  }
}

//NOTE: Get2faByUserId
export async function GET(req: Request) {
  try {
    console.log("Fetching 2FA status");
    
    const userId = await validateUserToken(req);
    
    console.log("Fetching 2FA for user ID:", userId);
    
    const twofa = await getTwofaByUserId(userId);
    
    // Return consistent response even if no 2FA is set up
    const response = twofa || { 
      enabled: false, 
      message: "2FA not configured" 
    };

    console.log("2FA status fetched for user:", userId);
    
    return success_response(response, "2FA status fetched successfully", 200);
    
  } catch (err) {
    console.error("GET /api/twofa error:", err);
    
    // Handle specific error types
    if ((err as any)?.message?.includes("token")) {
      return error_response((err as any).message, 401);
    }
    
    if ((err as any)?.code === 'P2025') { // Record not found
      // For GET requests, not finding 2FA isn't necessarily an error
      return success_response(
        { enabled: false }, 
        "2FA not configured", 
        200
      );
    }
    
    return error_response(
      (err as any)?.message || "Failed to fetch 2FA status", 
      500
    );
  }
}

//NOTE: Delete2fa
export async function DELETE(req: Request) {
  try {
    console.log("Deleting 2FA");
    
    const userId = await validateUserToken(req);
    
    console.log("Deleting 2FA for user ID:", userId);
    
    const twofa = await delete2fa(userId);
    
    if (!twofa) {
      return error_response("2FA not found or already disabled", 404);
    }

    console.log("2FA deleted successfully for user:", userId);
    
    return success_response(twofa, "2FA disabled successfully", 200);
    
  } catch (err) {
    console.error("DELETE /api/twofa error:", err);
    
    // Handle specific error types
    if ((err as any)?.message?.includes("token")) {
      return error_response((err as any).message, 401);
    }
    
    if ((err as any)?.code === 'P2025') { // Record not found
      return error_response("2FA not found or already disabled", 404);
    }
    
    if ((err as any)?.name === 'DatabaseError') {
      return error_response("Database operation failed", 500);
    }
    
    return error_response(
      (err as any)?.message || "Failed to disable 2FA", 
      500
    );
  }
}

// Optional: Add OPTIONS method for CORS support
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}