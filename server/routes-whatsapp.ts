import { Router } from "express";
import fs from "fs";
import path from "path";
import { WhatsAppFlowsEncryption } from "./whatsapp-encryption.js";

const router = Router();
const PRIVATE_KEY = fs.readFileSync(path.join(process.cwd(), "private_key.pem"), "utf8");
const encryptor = new WhatsAppFlowsEncryption(PRIVATE_KEY);

// WhatsApp Flow Endpoint
router.post("/whatsapp-flow", async (req, res) => {
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
      return res.status(400).send("Missing encryption parameters");
    }

    // 1. Decrypt Request
    const decryptedRequest = encryptor.decrypt(
      encrypted_flow_data,
      encrypted_aes_key,
      initial_vector
    );

    console.log("Decrypted Flow Request:", decryptedRequest);

    // 2. Define standard responses based on the screen requested
    const responses: Record<string, any> = {
      SIGN_IN: {
        screen: "SIGN_IN",
        data: {}
      },
      SIGN_UP: {
        screen: "SIGN_UP",
        data: {}
      },
      SUCCESS: {
        screen: "SUCCESS",
        data: {
          extension_message_response: {
            params: {
              flow_token: decryptedRequest.flow_token,
              status: "completed"
            }
          }
        }
      }
    };

    const nextScreen = decryptedRequest.action === "INIT" ? "SIGN_IN" : "SUCCESS";
    const responsePayload = responses[nextScreen] || responses.SUCCESS;

    // 3. Encrypt Response using same AES key and IV
    const encryptedResponse = encryptor.encrypt(
      responsePayload,
      encrypted_aes_key, // Re-use the same AES key provided by Meta
      initial_vector
    );

    res.send(encryptedResponse);
  } catch (error) {
    console.error("WhatsApp Flow Error:", error);
    res.status(421).send("Decryption failed");
  }
});

export default router;
