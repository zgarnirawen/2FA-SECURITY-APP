import { getTwofaByEmail, verifyTwofaTokenByEmail } from "@/lib/actions/twofa";
import { error_response, success_response } from "@/lib/utils";

//NOTE: GetTwofaByEmail
export async function POST(req: Request) {
  try {
    let body;
    
    // Safely parse JSON body
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return error_response("Invalid JSON in request body", 400);
    }

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return error_response("Request body must be a valid JSON object", 400);
    }

    const { email } = body;

    // Validate email presence
    if (!email) {
      return error_response("Email is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error_response("Invalid email format", 400);
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    // Log request for debugging (sanitized)
    console.log("Fetching 2FA status for email:", "***@" + sanitizedEmail.split("@")[1]);

    const twofa = await getTwofaByEmail(sanitizedEmail);
    
    // Handle case where user/2FA doesn't exist
    if (!twofa) {
      // Don't reveal whether the email exists or not for security
      return error_response("2FA not found or not enabled", 404);
    }

    // Filter sensitive data before sending response
    const safeResponse = {
      enabled: twofa.enabled || false,
      // Don't include secret or other sensitive 2FA data
      // Only return what the client needs to know
    };

    console.log("2FA status fetched successfully");
    
    return success_response(safeResponse, "2FA status fetched successfully", 200);
    
  } catch (err) {
    console.error("POST /api/twofa-by-email error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Email validation failed", 400);
    }
    
    if ((err as any)?.code === 'P2025') { // Prisma record not found
      return error_response("2FA not found or not enabled", 404);
    }
    
    if ((err as any)?.code === 'P2002') { // Prisma unique constraint error
      return error_response("Email conflict", 409);
    }
    
    // Database connection errors
    if ((err as any)?.code === 'ECONNREFUSED' || (err as any)?.name === 'ConnectionError') {
      return error_response("Database connection failed", 503);
    }
    
    // Rate limiting errors
    if ((err as any)?.name === 'TooManyRequestsError') {
      return error_response("Too many requests. Please try again later.", 429);
    }
    
    return error_response(
      (err as any)?.message || "Failed to fetch 2FA status", 
      500
    );
  }
}

//NOTE: VerifyTwofaTokenByEmail
export async function PUT(req: Request) {
  try {
    let body;
    
    // Safely parse JSON body
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return error_response("Invalid JSON in request body", 400);
    }

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return error_response("Request body must be a valid JSON object", 400);
    }

    const { email, token } = body;

    // Validate required fields
    if (!email && !token) {
      return error_response("Email and 2FA token are required", 400);
    }
    
    if (!email) {
      return error_response("Email is required", 400);
    }
    
    if (!token) {
      return error_response("2FA token is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error_response("Invalid email format", 400);
    }

    // Validate 2FA token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return error_response("2FA token must be 6 digits", 400);
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();

    // Log request for debugging (sanitized)
    console.log("Verifying 2FA token for email:", "***@" + sanitizedEmail.split("@")[1]);

    const verificationResult = await verifyTwofaTokenByEmail(sanitizedEmail, token);
    
    // Handle verification failure
    if (!verificationResult) {

      // Don't reveal specific failure reason for security
      return error_response("Invalid or expired 2FA token", 401);
    }

    // Filter response data
    const safeResponse = {
      verified: true,
      timestamp: new Date().toISOString(),
      // Include any safe data from verificationResult
      // but exclude sensitive information
    };

    console.log("2FA token verified successfully");
    
    return success_response(safeResponse, "2FA verified successfully", 200);
    
  } catch (err) {
    console.error("PUT /api/twofa-by-email error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Input validation failed", 400);
    }
    
    if ((err as any)?.message?.includes("Invalid") || (err as any)?.message?.includes("expired")) {
      return error_response("Invalid or expired 2FA token", 401);
    }
    
    if ((err as any)?.code === 'P2025') { // Prisma record not found
      return error_response("2FA not found or user not found", 404);
    }
    
    // Rate limiting for failed attempts
    if ((err as any)?.name === 'TooManyRequestsError') {
      return error_response("Too many verification attempts. Please try again later.", 429);
    }
    
    // Database connection errors
    if ((err as any)?.code === 'ECONNREFUSED' || (err as any)?.name === 'ConnectionError') {
      return error_response("Database connection failed", 503);
    }
    
    return error_response(
      (err as any)?.message || "2FA verification failed", 
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
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}