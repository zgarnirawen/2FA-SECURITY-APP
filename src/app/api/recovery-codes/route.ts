import {
  bulkCreateRecoveryCodes,
  getAllUserRecoveryCodes,
  getRecoveryCodeForSignin,
} from "@/lib/actions/recovery-codes";
import { error_response, success_response, validateToken } from "@/lib/utils";

//NOTE: BulkCreateRecoveryCodes
export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization");
    
    // Check if token exists
    if (!token) {
      return error_response("Authorization token is required", 401);
    }

    const validatedToken = await validateToken(token);
    
    // Check if token validation succeeded
    if (!validatedToken || !validatedToken.userId) {
      return error_response("Invalid or expired token", 401);
    }

    const twofa = await bulkCreateRecoveryCodes(validatedToken.userId);
    
    return success_response(
      twofa,
      "Recovery codes generated successfully",
      201
    );
  } catch (err) {
    console.error("POST /api/recovery-codes error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Token validation failed", 401);
    }
    
    if ((err as any)?.name === 'DatabaseError') {
      return error_response("Database operation failed", 500);
    }
    
    return error_response(
      (err as any)?.message || "Internal server error", 
      500
    );
  }
}

//NOTE: GetRecoveryCodeForSignin
export async function PUT(req: Request) {
  try {
    let body;
    
    // Safely parse JSON body
    try {
      body = await req.json();
    } catch (parseError) {
      return error_response("Invalid JSON in request body", 400);
    }

    // Validate required fields
    if (!body?.email || !body?.code) {
      return error_response("Email and recovery code are required", 400);
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return error_response("Invalid email format", 400);
    }

    const recoveryCode = await getRecoveryCodeForSignin(
      body.email,
      body.code
    );

    return success_response(
      recoveryCode,
      "Recovery code status fetched successfully",
      200
    );
  } catch (err) {
    console.error("PUT /api/recovery-codes error:", err);
    
    // Handle specific database errors
    if ((err as any)?.code === 'P2025') { // Prisma not found error
      return error_response("Recovery code not found", 404);
    }
    
    return error_response(
      (err as any)?.message || "Internal server error", 
      500
    );
  }
}

//NOTE: GetAllUserRecoveryCodes
export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization");
    
    // Check if token exists
    if (!token) {
      return error_response("Authorization token is required", 401);
    }

    const validatedToken = await validateToken(token);
    
    // Check if token validation succeeded
    if (!validatedToken || !validatedToken.userId) {
      return error_response("Invalid or expired token", 401);
    }

    const recoveryCodes = await getAllUserRecoveryCodes(validatedToken.userId);
    
    return success_response(
      recoveryCodes, 
      "Recovery codes fetched successfully", 
      200
    );
  } catch (err) {
    console.error("GET /api/recovery-codes error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Token validation failed", 401);
    }
    
    return error_response(
      (err as any)?.message || "Internal server error", 
      500
    );
  }
}

// Optional: Add OPTIONS method for CORS if needed
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}