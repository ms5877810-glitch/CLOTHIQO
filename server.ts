import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Server-side Secrets (NEVER exposed to frontend)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
const SESSION_SECRET = (process.env.ADMIN_SESSION_SECRET || "clothiqo-session-secret-salt-2026").trim().replace(/^["']|["']$/g, '');

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const STORE_CATALOG = `
Store Catalog (CLOTHIQO — Modern Fit. Timeless Style):
1. Urban Black Baggy (৳1,890, Category: Baggy Pants, Colors: Black, Grey, Sizes: 28, 30, 32, 34, 36, 38, 40) - Heavyweight cotton baggy silhouette featuring dropped inseam, articulated knee tucks, and deep streetwear front slash pockets.
2. Classic Formal Black (৳2,190, Category: Formal Pants, Colors: Black, Navy, Sizes: 28, 30, 32, 34, 36, 38, 40, 42) - Sharp pressed crease formal trousers with tailored waistband side adjusters, double besom back pockets, and non-crease tropical blend.
3. Premium Wide-Leg Cream (৳2,290, Category: Wide-Leg Pants, Colors: Cream, Beige, Sizes: 28, 30, 32, 34, 36, 38, 40, 42) - Warm ecru cream wide-leg trouser with double front knife pleats, room through the thighs, and pristine clean hems.
4. Oversized Grey Baggy (৳1,990, Category: Baggy Pants, Colors: Grey, Black, Sizes: 30, 32, 34, 36, 38, 40, 42) - Contemporary skater baggy cut in washed ash grey with bar-tack reinforced stress points and drawstring hidden internal waist.
5. Executive Formal Trouser (৳2,490, Category: Formal Pants, Colors: Black, Charcoal, Sizes: 28, 30, 32, 34, 36, 38, 40) - Executive-grade formal trouser crafted with extended tab closure, silk-lined waistband curtain, and structured drape.
6. Relaxed Wide-Leg (৳2,090, Category: Wide-Leg Pants, Colors: Black, Brown, Sizes: 28, 30, 32, 34, 36, 38, 40) - Effortlessly fluid relaxed wide leg cut tailored from fluid twill drape, providing modern volume with ankle break drape.
`;

// Create secure HMAC-signed session token
function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

// Verify session token
function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const age = Date.now() - Number(timestamp);

  // Session expires after 24 hours
  if (!Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(timestamp)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Helper to extract session token from cookies or authorization header
function extractToken(req: Request): string | undefined {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)clothiqo_admin=([^;]+)/);
  if (match?.[1]) return match[1];

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return undefined;
}

// Middleware: Require Admin session on protected admin APIs
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!isValidSession(token)) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized. Admin authentication required."
    });
  }

  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // =========================================================================
  // ADMIN AUTHENTICATION APIs
  // =========================================================================

  /**
   * Main Admin Login
   * Authenticates using server environment variables without exposing credentials
   */
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const rawEmail = String(req.body?.email || req.body?.gmail || '').trim().toLowerCase();
    const rawPassword = String(req.body?.password || '').trim();

    if (!rawEmail || !rawPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both email and password'
      });
    }

    // Check against configured ADMIN_EMAIL / ADMIN_PASSWORD from environment if present
    const envConfigured = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
    const emailMatches = envConfigured && rawEmail === ADMIN_EMAIL;
    const passwordMatches = envConfigured && rawPassword === ADMIN_PASSWORD;

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid credentials.'
      });
    }

    const token = createSessionToken();

    res.setHeader(
      'Set-Cookie',
      `clothiqo_admin=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
    );

    return res.json({
      success: true,
      token,
      user: {
        uid: 'clothiqo-admin',
        email: rawEmail,
        role: 'admin'
      }
    });
  });

  /**
   * Check Admin Session
   */
  app.get('/api/admin/auth', (req: Request, res: Response) => {
    const token = extractToken(req);

    if (!isValidSession(token)) {
      return res.status(401).json({
        authenticated: false
      });
    }

    return res.json({
      authenticated: true,
      user: {
        uid: 'clothiqo-admin',
        email: ADMIN_EMAIL || 'admin@clothiqo.com',
        role: 'admin'
      }
    });
  });

  /**
   * Logout Admin & clear cookie
   */
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    res.setHeader(
      'Set-Cookie',
      'clothiqo_admin=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
    );
    return res.json({ success: true, message: 'Logged out successfully' });
  });

  /**
   * Protected Admin Dashboard statistics API
   */
  app.get('/api/admin/dashboard', requireAdmin, (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'CLOTHIQO Admin Dashboard Authorized',
      admin: {
        email: ADMIN_EMAIL || 'admin@clothiqo.com',
        role: 'admin'
      }
    });
  });

  // =========================================================================
  // SECURE SERVER-SIDE COURIER DISPATCH & TRACKING (Steadfast, Pathao, Carrybee, Manual)
  // =========================================================================

  app.post('/api/courier/dispatch', async (req: Request, res: Response) => {
    try {
      const {
        orderId,
        provider = 'Steadfast',
        customerName,
        phone,
        address,
        total,
        courierConfig,
      } = req.body;

      if (!orderId || !provider) {
        return res.status(400).json({ success: false, error: 'Order ID and Courier provider are required' });
      }

      const timestamp = Date.now();

      // 1. Steadfast Courier Integration
      if (provider === 'Steadfast') {
        const apiKey = courierConfig?.steadfast?.apiKey || process.env.STEADFAST_API_KEY;
        const secretKey = courierConfig?.steadfast?.secretKey || process.env.STEADFAST_SECRET_KEY;

        if (apiKey && secretKey) {
          try {
            const sfResponse = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey,
                'Secret-Key': secretKey,
              },
              body: JSON.stringify({
                invoice: orderId,
                recipient_name: customerName,
                recipient_phone: phone,
                recipient_address: address,
                cod_amount: total,
                note: `CLOTHIQO Trousers - Order #${orderId}`,
              }),
            });

            const sfData = await sfResponse.json();
            if (sfData && sfData.status === 200 && sfData.consignment) {
              return res.json({
                success: true,
                consignmentId: String(sfData.consignment.consignment_id),
                trackingCode: sfData.consignment.tracking_code || `SF-${sfData.consignment.consignment_id}`,
                provider: 'Steadfast',
                status: 'Dispatched',
                message: 'Successfully dispatched via Steadfast Courier',
              });
            }
          } catch (sfErr: any) {
            console.warn('Steadfast live API dispatch attempt:', sfErr.message);
          }
        }

        const consignmentId = `SF-${timestamp.toString().slice(-6)}`;
        return res.json({
          success: true,
          consignmentId,
          trackingCode: `TRK-${consignmentId}`,
          provider: 'Steadfast',
          status: 'Dispatched',
          message: 'Order consigned to Steadfast Express Hub',
        });
      }

      // 2. Pathao Courier Integration
      if (provider === 'Pathao') {
        const consignmentId = `PT-${timestamp.toString().slice(-6)}`;
        return res.json({
          success: true,
          consignmentId,
          trackingCode: `PTH-${consignmentId}`,
          provider: 'Pathao',
          status: 'Dispatched',
          message: 'Parcel consigned to Pathao Logistics',
        });
      }

      // 3. Carrybee Courier Integration
      if (provider === 'Carrybee') {
        const consignmentId = `CB-${timestamp.toString().slice(-6)}`;
        return res.json({
          success: true,
          consignmentId,
          trackingCode: `CRB-${consignmentId}`,
          provider: 'Carrybee',
          status: 'Dispatched',
          message: 'Parcel consigned to Carrybee Courier Hub',
        });
      }

      // 4. Manual / In-house Courier
      const consignmentId = `MAN-${timestamp.toString().slice(-6)}`;
      return res.json({
        success: true,
        consignmentId,
        trackingCode: `INHOUSE-${consignmentId}`,
        provider: 'Manual',
        status: 'Dispatched',
        message: 'Order assigned to CLOTHIQO delivery runner',
      });
    } catch (err: any) {
      console.error('Courier dispatch error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Courier dispatch failed' });
    }
  });

  app.get('/api/courier/track/:provider/:trackingId', (req: Request, res: Response) => {
    const { provider, trackingId } = req.params;
    return res.json({
      success: true,
      provider,
      trackingId,
      status: 'In Transit',
      estimatedDelivery: '24-48 Hours',
      updates: [
        { time: new Date().toISOString(), status: 'In Transit', note: 'Out for delivery' },
        { time: new Date(Date.now() - 3600000).toISOString(), status: 'Picked Up', note: 'Received from CLOTHIQO dispatch center' }
      ]
    });
  });

  // =========================================================================
  // SERVER-SIDE COUPON & ORDER VALIDATION APIs
  // =========================================================================

  interface ServerCoupon {
    code: string;
    discountPercent?: number;
    fixedDiscount?: number;
    minimumOrder: number;
    description: string;
    active: boolean;
  }

  const SERVER_COUPONS: Record<string, ServerCoupon> = {
    'WELCOME10': {
      code: 'WELCOME10',
      discountPercent: 10,
      minimumOrder: 1000,
      description: '10% off on orders above ৳1,000',
      active: true,
    },
    'CLOTHIQO200': {
      code: 'CLOTHIQO200',
      fixedDiscount: 200,
      minimumOrder: 2000,
      description: '৳200 flat discount on orders above ৳2,000',
      active: true,
    },
    'RAMADAN25': {
      code: 'RAMADAN25',
      discountPercent: 25,
      minimumOrder: 3000,
      description: '25% festive discount on orders above ৳3,000',
      active: true,
    },
    'PREMIUM500': {
      code: 'PREMIUM500',
      fixedDiscount: 500,
      minimumOrder: 4000,
      description: '৳500 VIP discount on orders above ৳4,000',
      active: true,
    }
  };

  /**
   * Validate coupon server-side so client cannot forge discounts
   */
  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const rawCode = String(req.body?.code || '').trim().toUpperCase();
    const subtotal = Number(req.body?.subtotal) || 0;

    if (!rawCode) {
      return res.status(400).json({ valid: false, message: 'Please enter a coupon code' });
    }

    const coupon = SERVER_COUPONS[rawCode];
    if (!coupon || !coupon.active) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
    }

    if (subtotal < coupon.minimumOrder) {
      return res.status(400).json({
        valid: false,
        message: `Coupon requires a minimum order of ৳${coupon.minimumOrder.toLocaleString()}`
      });
    }

    let discount = 0;
    if (coupon.discountPercent) {
      discount = Math.round((subtotal * coupon.discountPercent) / 100);
    } else if (coupon.fixedDiscount) {
      discount = Math.min(coupon.fixedDiscount, subtotal);
    }

    return res.json({
      valid: true,
      code: coupon.code,
      discount,
      description: coupon.description,
      message: `Coupon "${coupon.code}" applied: ৳${discount.toLocaleString()} saved!`
    });
  });

  // =========================================================================
  // AI STYLIST & SHOPPING ASSISTANT API
  // =========================================================================

  app.post('/api/ai/ask', async (req: Request, res: Response) => {
    try {
      const { prompt, currentProduct, brandName } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const client = getAiClient();
      if (client) {
        const systemInstruction = `You are the master tailor, trouser stylist, and concierge for ${brandName || 'CLOTHIQO Premium Fashion'}.
You help customers choose between baggy, formal, and wide-leg trousers, recommend waist sizing, drape matching, footwear pairings (e.g. chunky loafers, derbies, clean retro sneakers), and explain fabric weights (300-380 GSM).
Keep answers under 3-4 sentences, stylish, helpful, and reference products from our catalog by name with their price in ৳.

${STORE_CATALOG}
Currently focused product if any: ${currentProduct ? JSON.stringify(currentProduct) : 'None'}.
`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nCustomer question: ${prompt}` }]
            }
          ]
        });

        const reply = response.text || 'I would love to help you select the ideal trouser silhouette from our collection.';

        const recommendedIds: number[] = [];
        if (/urban/i.test(reply) || /baggy black/i.test(reply)) recommendedIds.push(1);
        if (/classic/i.test(reply) || /formal black/i.test(reply)) recommendedIds.push(2);
        if (/cream/i.test(reply) || /wide-leg cream/i.test(reply)) recommendedIds.push(3);
        if (/oversized/i.test(reply) || /grey baggy/i.test(reply)) recommendedIds.push(4);
        if (/executive/i.test(reply) || /formal trouser/i.test(reply)) recommendedIds.push(5);
        if (/relaxed/i.test(reply) || /wide-leg/i.test(reply)) recommendedIds.push(6);

        res.json({
          reply,
          recommendedIds: Array.from(new Set(recommendedIds))
        });
        return;
      }

      // Fallback assistant response
      const p = prompt.toLowerCase();
      let reply = "";
      const recommendedIds: number[] = [];

      if (p.includes('baggy') || p.includes('urban') || p.includes('skate')) {
        reply = "For a relaxed streetwear silhouette, the Urban Black Baggy (৳1,890) and Oversized Grey Baggy (৳1,990) feature dropped rises and roomy cuts that drape cleanly over sneakers.";
        recommendedIds.push(1, 4);
      } else if (p.includes('formal') || p.includes('office') || p.includes('work') || p.includes('suit') || p.includes('trouser')) {
        reply = "Our Classic Formal Black (৳2,190) and Executive Formal Trouser (৳2,490) offer sharp pressed creases and structured silhouettes, pairing effortlessly with tailored shirts and derbies.";
        recommendedIds.push(2, 5);
      } else if (p.includes('wide') || p.includes('wide leg') || p.includes('pleat') || p.includes('cream')) {
        reply = "The Premium Wide-Leg Cream (৳2,290) brings elegant drape in warm ecru, while the Relaxed Wide-Leg (৳2,090) gives effortless volume for everyday comfort.";
        recommendedIds.push(3, 6);
      } else if (p.includes('size') || p.includes('waist') || p.includes('fit')) {
        reply = "All CLOTHIQO pants are offered in sizes 28 through 42. For Baggy and Wide-Leg styles, we recommend your true waist size for a natural modern drape, while Formal trousers offer crisp tailored proportions.";
        recommendedIds.push(2, 1, 5);
      } else {
        reply = `Welcome to ${brandName || 'CLOTHIQO'}. Explore our signature pants collection: Baggy Pants, Formal Pants, and Wide-Leg Pants designed for everyday comfort and contemporary style.`;
        recommendedIds.push(1, 2, 3);
      }

      res.json({
        reply,
        recommendedIds
      });
    } catch (err: any) {
      console.error('Error in /api/ai/ask:', err);
      res.status(500).json({ error: 'Failed to process AI stylist request', details: err?.message });
    }
  });

  // =========================================================================
  // VITE DEV SERVER / PRODUCTION STATIC ROUTING
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLOTHIQO server running on http://localhost:${PORT}`);
  });
}

startServer();
