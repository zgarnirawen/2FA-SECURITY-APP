import { createUser } from "@/lib/actions/user";
import { error_response, success_response } from "@/lib/utils";
import { CreateUserInputValidation } from "@/lib/validations";

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
    console.log("Registration request body:", {
      email: body?.email ? "***@" + body.email.split("@")[1] : "missing",
      password: body?.password ? "provided" : "missing",
      name: body?.name ? "provided" : "missing"
    });

    // Check if body exists and has required structure
    if (!body || typeof body !== 'object') {
      return error_response("Request body must be a valid JSON object", 400);
    }

    // Basic field presence validation before Zod
    const requiredFields = ['email', 'password'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return error_response(
        `Missing required fields: ${missingFields.join(', ')}`, 
        400
      );
    }

    // Zod validation
    const inputValidation = CreateUserInputValidation.safeParse(body);
    if (!inputValidation.success) {
      console.error("Validation error:", inputValidation.error.format());
      
      // Extract meaningful error messages
      const errorMessages = inputValidation.error.issues.map(issue => {
        const field = issue.path.join('.');
        return `${field}: ${issue.message}`;
      }).join(', ');
      
      return error_response(
        `Input validation failed: ${errorMessages}`,
        400,
        inputValidation.error.format()
      );
    }

    // Additional security checks
    const { email, password, name } = body;

    // Check password strength (if not handled by Zod)
    if (password.length < 8) {
      return error_response("Password must be at least 8 characters long", 400);
    }

    // Basic email format validation (additional to Zod)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error_response("Invalid email format", 400);
    }

    // Sanitize input data
    const sanitizedData = {
      email: email.toLowerCase().trim(),
      password: password, // Don't trim passwords as spaces might be intentional
      ...(name && { name: name.trim() }),
      ...body // Include other validated fields
    };

    // Attempt user creation
    const user = await createUser(sanitizedData);
    
    // Check if user creation was successful
    if (!user) {
      return error_response("Failed to create user", 500);
    }

    // Remove sensitive data before sending response
    const safeUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      // Don't return password, tokens, or other sensitive data
    };

    console.log("User created successfully:", user.id);
    
    return success_response(safeUserData, "User created successfully", 201);
    
  } catch (err) {
    console.error("POST /api/register error:", err);
    
    // Handle specific error types
    if ((err as any)?.name === 'ValidationError') {
      return error_response("Validation failed", 400);
    }
    
    // Handle duplicate email/username errors
    if ((err as any)?.code === 'P2002') { // Prisma unique constraint error
      const field = (err as any)?.meta?.target?.[0] || 'field';
      return error_response(`${field} already exists`, 409);
    }
    
    // Handle database constraint violations
    if ((err as any)?.code === 'P2000') { // Value too long
      return error_response("Input data too long", 400);
    }
    
    if ((err as any)?.code === 'P2001') { // Record not found (foreign key)
      return error_response("Invalid reference data", 400);
    }
    
    // Database connection errors
    if ((err as any)?.code === 'ECONNREFUSED' || (err as any)?.name === 'ConnectionError') {
      return error_response("Database connection failed", 503);
    }
    
    // Email service errors (if sending welcome email)
    if ((err as any)?.name === 'EmailError') {
      // Still return success if user was created but email failed
      console.error("Email sending failed, but user was created");
      return error_response("User created but welcome email failed to send", 201);
    }
    
    // Rate limiting errors
    if ((err as any)?.name === 'TooManyRequestsError') {
      return error_response("Too many registration attempts. Please try again later.", 429);
    }
    
    // Password hashing errors
    if ((err as any)?.name === 'HashingError') {
      return error_response("Password processing failed", 500);
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