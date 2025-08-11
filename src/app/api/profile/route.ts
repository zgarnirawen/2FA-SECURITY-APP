import { getUserById } from "@/lib/actions/user";
import { error_response, success_response, validateToken } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization");
    
    // Check if token exists
    if (!token) {
      return error_response("Authorization token is required", 401);
    }

    // Log token format for debugging (remove in production)
    console.log("Token received:", token.startsWith("Bearer ") ? "Bearer format" : "Raw token format");

    let validatedToken;
    
    try {
      validatedToken = await validateToken(token);
    } catch (tokenError) {
      console.error("Token validation error:", tokenError);
      return error_response("Invalid or expired token", 401);
    }
    
    // Check if token validation succeeded and contains userId
    if (!validatedToken) {
      return error_response("Token validation failed", 401);
    }
    
    if (!validatedToken.userId) {
      return error_response("Invalid token: missing user ID", 401);
    }

    console.log("Fetching user with ID:", validatedToken.userId);

    const user = await getUserById(validatedToken.userId);
    
    // Check if user exists
    if (!user) {
      return error_response("User not found", 404);
    }

    // Remove sensitive data before sending response
    const safeUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Add other safe fields as needed, but exclude:
      // - password/hashedPassword
      // - sensitive tokens
      // - internal flags
    };

    console.log("User fetched successfully:", user.id);
    
    return success_response(safeUserData, "User fetched successfully", 200);
    
  } catch (err) {
    console.error("GET /api/user error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Token validation failed", 401);
    }
    
    if ((err as any)?.name === 'JsonWebTokenError') {
      return error_response("Invalid token format", 401);
    }
    
    if ((err as any)?.name === 'TokenExpiredError') {
      return error_response("Token has expired", 401);
    }
    
    if ((err as any)?.code === 'P2025') { // Prisma record not found
      return error_response("User not found", 404);
    }
    
    if ((err as any)?.code === 'P2002') { // Prisma unique constraint error
      return error_response("User data conflict", 409);
    }
    
    // Database connection errors
    if ((err as any)?.code === 'ECONNREFUSED' || (err as any)?.name === 'ConnectionError') {
      return error_response("Database connection failed", 503);
    }
    
    // Generic error fallback
    const errorMessage = (err as any)?.message || "Internal server error";
    const statusCode = (err as any)?.statusCode || 500;
    
    return error_response(errorMessage, statusCode);
  }
}

// Optional: Add OPTIONS method for CORS support
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}