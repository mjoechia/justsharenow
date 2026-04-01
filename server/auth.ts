import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
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
    }
  }
}

const MASTER_ADMIN_USERNAME = "jc141319";

export async function getSessionTimeoutMs(): Promise<number> {
  try {
    const timeoutMinutes = await storage.getSessionTimeoutMinutes();
    return timeoutMinutes * 60 * 1000;
  } catch (error) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES * 60 * 1000;
  }
}

export async function getSession() {
  const sessionTtl = await getSessionTimeoutMs();
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: Math.floor(sessionTtl / 1000),
    schemaName: "app_justsharenow",
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: sessionTtl,
    },
  });
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

      console.log(`[Login] User logged in: id=${user.id}, username=${user.username}, role=${user.role}`);

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
  app.post("/api/auth/master-login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

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

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
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
    return res.status(401).json({ message: "Session expired. Please log in again." });
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

  const reqUser = req.user as Express.User;
  reqUser.role = user.role;

  return next();
};
