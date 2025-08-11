import { createUser } from "@/lib/actions/user";
import { error_response, success_response } from "@/lib/utils";
import { CreateUserInputValidation } from "@/lib/validations";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  [key: string]: any;
}

export async function POST(req: Request): Promise<Response> {
  try {
    let body: RegisterBody;

    // Parse JSON body
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return error_response("Invalid JSON in request body", 400);
    }

    // Log for debugging
    console.log("Registration request body:", {
      email: body?.email ? "***@" + body.email.split("@")[1] : "missing",
      password: body?.password ? "provided" : "missing",
      name: body?.name ? "provided" : "missing"
    });

    // Check body structure
    if (!body || typeof body !== "object") {
      return error_response("Request body must be a valid JSON object", 400);
    }

    // Required fields
    const requiredFields = ["email", "password"];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return error_response(`Missing required fields: ${missingFields.join(", ")}`, 400);
    }

    // Zod validation
    const inputValidation = CreateUserInputValidation.safeParse(body);
    if (!inputValidation.success) {
      console.error("Validation error:", inputValidation.error.format());

      const errorMessages = inputValidation.error.issues
        .map(issue => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      return error_response(`Input validation failed: ${errorMessages}`, 400, inputValidation.error.format());
    }

    const { email, password, name } = body;

    // Password strength check
    if (password.length < 8) {
      return error_response("Password must be at least 8 characters long", 400);
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error_response("Invalid email format", 400);
    }

    // Prepare sanitized data with full_name (as required by your type)
    const sanitizedData = {
      email: email.toLowerCase().trim(),
      password: password, // Don't trim passwords
      full_name: (name || "").trim() // Match type requirement
    };

    // Create user
    const user = await createUser(sanitizedData);

    if (!user) {
      return error_response("Failed to create user", 500);
    }

    // Safe response
    const safeUserData = {
      id: user.id,
      email: user.email,
      name: user.name || user.full_name,
      createdAt: user.createdAt
    };

    console.log("User created successfully:", user.id);

    return success_response(safeUserData, "User created successfully", 201);
  } catch (err) {
    console.error("POST /api/register error:", err);

    if ((err as any)?.name === "ValidationError") {
      return error_response("Validation failed", 400);
    }

    if ((err as any)?.code === "P2002") {
      const field = (err as any)?.meta?.target?.[0] || "field";
      return error_response(`${field} already exists`, 409);
    }

    if ((err as any)?.code === "P2000") {
      return error_response("Input data too long", 400);
    }

    if ((err as any)?.code === "P2001") {
      return error_response("Invalid reference data", 400);
    }

    if ((err as any)?.code === "ECONNREFUSED" || (err as any)?.name === "ConnectionError") {
      return error_response("Database connection failed", 503);
    }

    if ((err as any)?.name === "EmailError") {
      console.error("Email sending failed, but user was created");
      return error_response("User created but welcome email failed to send", 201);
    }

    if ((err as any)?.name === "TooManyRequestsError") {
      return error_response("Too many registration attempts. Please try again later.", 429);
    }

    if ((err as any)?.name === "HashingError") {
      return error_response("Password processing failed", 500);
    }

    const errorMessage = (err as any)?.message || "Internal server error";
    const statusCode = (err as any)?.statusCode || 500;

    return error_response(errorMessage, statusCode);
  }
}

export async function OPTIONS(req: Request): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
