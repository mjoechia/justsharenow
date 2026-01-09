import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User, UserRole } from "@shared/schema";
import { DEFAULT_SESSION_TIMEOUT_MINUTES } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: number;
      role: UserRole;
      claims?: any;
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

const MASTER_ADMIN_USERNAME = "jc141319";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function getSessionTimeoutMs(): Promise<number> {
  try {
    const timeoutMinutes = await storage.getSessionTimeoutMinutes();
    return timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
  } catch (error) {
    // Default to 3 minutes if database not ready
    return DEFAULT_SESSION_TIMEOUT_MINUTES * 60 * 1000;
  }
}

export async function getSession() {
  const sessionTtl = await getSessionTimeoutMs();
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: Math.floor(sessionTtl / 1000), // ttl is in seconds for pg store
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset session expiry on each request
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

export async function initializeMasterAdmin(): Promise<void> {
  const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD;
  if (!masterAdminPassword) {
    console.warn("MASTER_ADMIN_PASSWORD not set - master admin login will not work");
    return;
  }

  const passwordHash = await bcrypt.hash(masterAdminPassword, 12);
  const existingMaster = await storage.getUserByUsername(MASTER_ADMIN_USERNAME);
  
  if (existingMaster) {
    // Update password hash if it changed
    if (existingMaster.passwordHash !== passwordHash) {
      await storage.updatePassword(existingMaster.id, passwordHash);
      console.log("Master admin password updated");
    } else {
      console.log("Master admin already exists");
    }
    return;
  }

  await storage.createUser({
    username: MASTER_ADMIN_USERNAME,
    passwordHash,
    displayName: "Master Admin",
    role: "master_admin",
    approvalStatus: "approved",
    isActive: true,
  });
  console.log("Master admin created successfully");
}

// Middleware to dynamically update session cookie maxAge based on current settings
// This allows session timeout changes to take effect without server restart
async function dynamicSessionTimeoutMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.cookie) {
    try {
      const timeoutMs = await getSessionTimeoutMs();
      req.session.cookie.maxAge = timeoutMs;
    } catch (error) {
      // Keep existing cookie maxAge if database unavailable
    }
  }
  next();
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(await getSession());
  app.use(dynamicSessionTimeoutMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  await initializeMasterAdmin();

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      if (!claims) {
        return verified(new Error("No claims in token"));
      }
      
      const googleId = claims.sub;
      const email = claims["email"] as string | undefined;
      const firstName = claims["first_name"] as string | undefined;
      const lastName = claims["last_name"] as string | undefined;
      const profileImage = claims["profile_image_url"] as string | undefined;
      
      let user = await storage.getUserByGoogleId(googleId);
      
      if (!user) {
        user = await storage.createUser({
          googleId,
          email: email || null,
          displayName: [firstName, lastName].filter(Boolean).join(" ") || email || "User",
          avatarUrl: profileImage || null,
          role: "admin",
          approvalStatus: "pending",
          isActive: true,
        });
        console.log(`New admin registered via Google: ${email}`);
      }

      const sessionUser: Express.User = {
        id: user.id,
        role: user.role,
        claims: claims,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: claims["exp"] as number,
      };

      verified(null, sessionUser);
    } catch (error) {
      console.error("Error in verify callback:", error);
      verified(error as Error);
    }
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Universal password-based login for all users (master admin, admins, and users)
  // Supports login via username OR email
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Debug: Log successful login
      console.log(`[Login] User logged in: id=${user.id}, username=${user.username}, role=${user.role}`);

      // Master admin bypasses approval check, others must be approved
      if (user.role !== 'master_admin' && user.approvalStatus !== 'approved') {
        if (user.approvalStatus === 'pending') {
          return res.status(403).json({ error: "Account pending approval. Please contact your administrator." });
        }
        return res.status(403).json({ error: "Account access denied" });
      }

      const sessionUser: Express.User = {
        id: user.id,
        role: user.role,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            approvalStatus: user.approvalStatus,
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Legacy route for backward compatibility
  // Supports login via username OR email
  app.post("/api/auth/master-login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.role !== "master_admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      const sessionUser: Express.User = {
        id: user.id,
        role: user.role,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
          }
        });
      });
    } catch (error) {
      console.error("Master login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const user = req.user as Express.User | undefined;
    const isOidcUser = user?.claims;
    
    req.logout(async () => {
      if (isOidcUser) {
        const config = await getOidcConfig();
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      } else {
        res.redirect("/");
      }
    });
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const sessionUser = req.user as Express.User;
      const user = await storage.getUserById(sessionUser.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const sessionUser = req.user as Express.User;
  
  if (sessionUser.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > sessionUser.expires_at) {
      const refreshToken = sessionUser.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ message: "Session expired" });
      }

      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(sessionUser, tokenResponse);
      } catch (error) {
        return res.status(401).json({ message: "Session expired" });
      }
    }
  }

  return next();
};

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessionUser = req.user as Express.User;
    const user = await storage.getUserById(sessionUser.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Account pending approval" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account disabled" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return next();
  };
};

export const requireMasterAdmin: RequestHandler = requireRole("master_admin");
export const requireAdmin: RequestHandler = requireRole("master_admin", "admin");
export const requireApproved: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const sessionUser = req.user as Express.User;
  const user = await storage.getUserById(sessionUser.id);
  
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  if (user.approvalStatus !== "approved") {
    return res.status(403).json({ message: "Account pending approval" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account disabled" });
  }

  return next();
};
