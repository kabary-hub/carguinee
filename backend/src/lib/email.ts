import { Resend } from "resend";
import { logger } from "./logger.js";

/**
 * Client Resend pour l'envoi d'emails transactionnels.
 * Utilise la clé API depuis les variables d'environnement.
 * Initialisation paresseuse — ne plante pas si la clé est absente.
 */
let resend: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_123")) {
    logger.warn("[RESEND] RESEND_API_KEY non définie — emails désactivés");
    return null;
  }
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Envoie un email de réinitialisation de mot de passe.
 * @returns true si l'email a été envoyé, false sinon
 */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    logger.warn("[RESEND] Email non envoyé — clé API absente");
    return false;
  }
  try {
    await client.emails.send({
      from: "CarGuinée <onboarding@resend.dev>",
      to,
      subject: "Réinitialisation de votre mot de passe — CarGuinée",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;">🚗 CarGuinée</h1>
              <p style="color:#d1fae5;font-size:14px;margin:8px 0 0;">Réinitialisation du mot de passe</p>
            </div>

            <!-- Body -->
            <div style="padding:32px;">
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Vous avez demandé la réinitialisation de votre mot de passe.
              </p>
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Voici votre code de vérification :
              </p>

              <!-- Code -->
              <div style="background:#f0fdf4;border:2px dashed #059669;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
                <p style="font-size:32px;font-weight:bold;color:#059669;letter-spacing:8px;margin:0;">
                  ${code}
                </p>
              </div>

              <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0 0 16px;">
                ⏱️ Ce code expire dans <strong>15 minutes</strong>.
              </p>
              <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} CarGuinée — Location de véhicules en Guinée
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    logger.error({ error }, "[RESEND] Failed to send password reset email");
    return false;
  }
}
