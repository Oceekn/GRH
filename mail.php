<?php
/**
 * Configuration et classe pour l'envoi d'emails via Gmail SMTP
 * RHorizon - Système de Gestion des Ressources Humaines
 */

class MailConfig {
    const SMTP_HOST = 'smtp.gmail.com';
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'gestionrh.app@gmail.com';
    const SMTP_PASSWORD = 'your_app_password_here';
    const FROM_EMAIL = 'gestionrh.app@gmail.com';
    const FROM_NAME = 'RHorizon - Système de Gestion RH';
    const TEMPLATES_DIR = __DIR__ . '/email_templates/';
    const UPLOADS_DIR = __DIR__ . '/uploads/payslips/';
}

class Mailer {
    private $from;
    private $fromName;

    public function __construct() {
        $this->from = MailConfig::FROM_EMAIL;
        $this->fromName = MailConfig::FROM_NAME;
    }

    /**
     * Envoie un email via Gmail SMTP
     */
    public function send($to, $subject, $body, $attachments = []) {
        try {
            // Configuration des headers
            $headers = [
                'From: ' . $this->fromName . ' <' . $this->from . '>',
                'Reply-To: ' . $this->from,
                'X-Mailer: RHorizon/1.0',
                'Content-Type: text/html; charset=UTF-8',
                'MIME-Version: 1.0'
            ];

            $headerString = implode("\r\n", $headers);

            // Utiliser la fonction mail() PHP
            // Pour une production robuste, installez PHPMailer via Composer
            if (mail($to, $subject, $body, $headerString)) {
                return ['success' => true, 'message' => 'Email envoyé avec succès'];
            } else {
                error_log("Erreur mail(): Impossible d'envoyer l'email à $to");
                return ['success' => false, 'message' => 'Erreur lors de l\'envoi de l\'email'];
            }
        } catch (Exception $e) {
            error_log("Exception Mailer: " . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur: ' . $e->getMessage()];
        }
    }

    /**
     * Envoie un bulletin de paie par email
     */
    public function sendPayslip($employeeEmail, $employeeName, $payslipData, $filePath) {
        $subject = 'Bulletin de paie - ' . $payslipData['period'];
        $body = $this->generatePayslipEmailBody($employeeName, $payslipData);
        return $this->send($employeeEmail, $subject, $body);
    }

    /**
     * Génère le corps de l'email du bulletin
     */
    private function generatePayslipEmailBody($employeeName, $payslipData) {
        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 20px auto; }
                .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f8f9fa; }
                .detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                .label { font-weight: bold; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .success { color: #27ae60; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Bulletin de Paie</h1>
                    <p>RHorizon - Système de Gestion des Ressources Humaines</p>
                </div>

                <div class='content'>
                    <p>Bonjour <strong>" . htmlspecialchars($employeeName) . "</strong>,</p>

                    <p>Veuillez trouver ci-joint votre bulletin de paie pour la période: <strong>" . htmlspecialchars($payslipData['period']) . "</strong></p>

                    <div class='detail'>
                        <span class='label'>Salaire de base:</span>
                        <span>" . number_format($payslipData['baseSalary'], 2, ',', ' ') . " FCFA</span>
                    </div>

                    <div class='detail'>
                        <span class='label'>Primes:</span>
                        <span>" . number_format($payslipData['bonus'], 2, ',', ' ') . " FCFA</span>
                    </div>

                    <div class='detail'>
                        <span class='label'>Cotisations:</span>
                        <span>- " . number_format($payslipData['contributions'], 2, ',', ' ') . " FCFA</span>
                    </div>

                    <div class='detail'>
                        <span class='label'>Impôts:</span>
                        <span>- " . number_format($payslipData['taxes'], 2, ',', ' ') . " FCFA</span>
                    </div>

                    <div class='detail'>
                        <span class='label'>Déductions:</span>
                        <span>- " . number_format($payslipData['deduction'], 2, ',', ' ') . " FCFA</span>
                    </div>

                    <div class='detail' style='border-bottom: 3px solid #2c3e50; font-weight: bold; font-size: 18px;'>
                        <span class='label'>Salaire Net:</span>
                        <span class='success'>" . number_format($payslipData['netSalary'], 2, ',', ' ') . " FCFA</span>
                    </div>

                    <p style='margin-top: 30px; color: #666;'>
                        Cet email a été généré automatiquement. Veuillez contacter le service RH pour toute question.
                    </p>
                </div>

                <div class='footer'>
                    <p>© 2024 RHorizon. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        return $body;
    }
}

?>
