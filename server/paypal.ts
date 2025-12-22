// PayPal Integration - Made Optional for Deployment Flexibility
// If PAYPAL_CLIENT_ID/SECRET are not set, PayPal features will be disabled but app will still run

import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";
import { getPayPalConfig } from "./utils/settings";

/* PayPal Controllers Setup */

let client: Client | null = null;
let ordersController: OrdersController | null = null;
let oAuthAuthorizationController: OAuthAuthorizationController | null = null;
let paypalClientId: string | null = null;
let paypalClientSecret: string | null = null;
let isPayPalConfigured = false;
let paypalInitPromise: Promise<void> | null = null;

async function initializePayPal(): Promise<void> {
  if (isPayPalConfigured) return;
  
  const config = await getPayPalConfig();
  paypalClientId = config.clientId;
  paypalClientSecret = config.clientSecret;
  
  if (paypalClientId && paypalClientSecret) {
    // Use environment from config (sandbox/production), NOT NODE_ENV
    // This allows sandbox credentials to work when deployed
    const useProduction = config.environment === 'production';
    const envName = useProduction ? 'Production' : 'Sandbox';
    
    client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: paypalClientId,
        oAuthClientSecret: paypalClientSecret,
      },
      timeout: 0,
      environment: useProduction ? Environment.Production : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: {
          logBody: true,
        },
        logResponse: {
          logHeaders: true,
        },
      },
    });
    ordersController = new OrdersController(client);
    oAuthAuthorizationController = new OAuthAuthorizationController(client);
    isPayPalConfigured = true;
    console.log(`✅ PayPal integration initialized (${envName} mode)`);
  } else {
    console.log("⚠️ PayPal not configured - credentials missing in database and environment");
  }
}

async function ensurePayPalInitialized(): Promise<void> {
  if (!paypalInitPromise) {
    paypalInitPromise = initializePayPal();
  }
  await paypalInitPromise;
}

// Initialize PayPal on module load
ensurePayPalInitialized().catch(err => console.error("PayPal init error:", err));

/* Token generation helpers */

export async function getClientToken() {
  await ensurePayPalInitialized();
  
  if (!isPayPalConfigured || !oAuthAuthorizationController) {
    throw new Error("PayPal is not configured");
  }
  
  const auth = Buffer.from(
    `${paypalClientId}:${paypalClientSecret}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  await ensurePayPalInitialized();
  
  if (!isPayPalConfigured || !ordersController) {
    return res.status(503).json({ error: "PayPal is not configured on this server" });
  }
  
  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  await ensurePayPalInitialized();
  
  if (!isPayPalConfigured || !ordersController) {
    return res.status(503).json({ error: "PayPal is not configured on this server" });
  }
  
  try {
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  await ensurePayPalInitialized();
  
  if (!isPayPalConfigured) {
    return res.status(503).json({ error: "PayPal is not configured on this server" });
  }
  
  try {
    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error) {
    console.error("Failed to get PayPal client token:", error);
    res.status(500).json({ error: "Failed to initialize PayPal" });
  }
}

// Export configuration status for other modules to check
export { isPayPalConfigured };
