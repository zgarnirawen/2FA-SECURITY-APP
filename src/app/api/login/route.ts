import { loginUser } from "@/lib/actions/user";
import { error_response, success_response } from "@/lib/utils";
import { LoginUserInputValidation } from "@/lib/validations";

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

    // Log the received body for debugging (remove in production)
    console.log("Login request body:", { 
      email: body?.email ? "***@" + body.email.split("@")[1] : "missing",
      password: body?.password ? "provided" : "missing" 
    });

    // Check if body exists and has required structure
    if (!body || typeof body !== 'object') {
      return error_response("Request body must be a valid JSON object", 400);
    }

    const { email, password } = body;

    // Basic field presence validation before Zod
    if (!email && !password) {
      return error_response("Email and password are required", 400);
    }
    
    if (!email) {
      return error_response("Email is required", 400);
    }
    
    if (!password) {
      return error_response("Password is required", 400);
    }

    // Zod validation
    const inputValidation = LoginUserInputValidation.safeParse(body);
    if (!inputValidation.success) {
      console.error("Validation error:", inputValidation.error.format());
      
      // Extract meaningful error messages
      const errorMessages = inputValidation.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      
      return error_response(
        `Input validation failed: ${errorMessages}`,
        400,
        inputValidation.error.format()
      );
    }

    // Attempt login
    const loginResult = await loginUser(email, password);
    
    // Check if login was successful
    if (!loginResult || !loginResult.token) {
      return error_response("Invalid credentials", 401);
    }

    console.log("Login successful, token generated");
    
    return success_response(loginResult, "User login successful", 200);
    
  } catch (err) {
    console.error("Login API error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Validation failed", 400);
    }
    
    if ((err as any)?.name === 'AuthenticationError') {
      return error_response("Invalid credentials", 401);
    }
    
    if ((err as any)?.code === 'P2002') { // Prisma unique constraint error
      return error_response("Account conflict", 409);
    }
    
    if ((err as any)?.code === 'P2025') { // Prisma record not found
      return error_response("User not found", 404);
    }
    
    // Database connection errors
    if ((err as any)?.code === 'ECONNREFUSED' || (err as any)?.name === 'ConnectionError') {
      return error_response("Database connection failed", 503);
    }
    
    // Rate limiting errors
    if ((err as any)?.name === 'TooManyRequestsError') {
      return error_response("Too many login attempts. Please try again later.", 429);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}