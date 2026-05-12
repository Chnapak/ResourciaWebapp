namespace Resourcia.Api.Services;

public static class EmailTemplates
{
    public static string BetaInvite(string registerUrl) => Layout(
        "You're invited to Resourcia",
        """
        <p style="margin:0 0 12px 0;">You've been invited to join <strong>Resourcia</strong> &mdash; a curated platform for discovering and sharing educational resources.</p>
        <p style="margin:0;">Click the button below to create your account and start exploring.</p>
        """,
        "Create your account",
        registerUrl,
        "You received this email because an admin invited you to Resourcia. If you weren't expecting this, you can safely ignore it."
    );

    public static string PasswordReset(string resetUrl) => Layout(
        "Reset your password",
        """
        <p style="margin:0 0 12px 0;">We received a request to reset the password for your Resourcia account.</p>
        <p style="margin:0;">Click the button below to choose a new password. This link expires in&nbsp;24&nbsp;hours.</p>
        """,
        "Reset password",
        resetUrl,
        "If you didn't request a password reset, you can safely ignore this email. Your password will not change."
    );

    public static string EmailConfirmation(string confirmUrl) => Layout(
        "Confirm your email address",
        """
        <p style="margin:0 0 12px 0;">Thanks for signing up for Resourcia!</p>
        <p style="margin:0;">Please confirm your email address to activate your account and start discovering resources.</p>
        """,
        "Confirm email address",
        confirmUrl,
        "If you didn't create a Resourcia account, you can safely ignore this email."
    );

    private static string Layout(string title, string bodyHtml, string ctaText, string ctaUrl, string disclaimer) => $"""
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>{title}</title>
        </head>
        <body style="margin:0;padding:0;background-color:#FCFBF4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
          <!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FCFBF4;min-width:100%;">
            <tr>
              <td align="center" style="padding:40px 16px;">

                <!-- Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:568px;">

                  <!-- Blue accent bar -->
                  <tr>
                    <td style="background-color:#3b82f6;height:4px;border-radius:8px 8px 0 0;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>

                  <!-- Card body -->
                  <tr>
                    <td style="background-color:#ffffff;padding:36px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

                      <!-- Logo -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                        <tr>
                          <td>
                            <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#2563eb;letter-spacing:-0.3px;text-decoration:none;">Resourcia</span>
                          </td>
                        </tr>
                      </table>

                      <!-- Divider -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                        <tr>
                          <td style="border-top:1px solid #f3f4f6;font-size:0;line-height:0;">&nbsp;</td>
                        </tr>
                      </table>

                      <!-- Title -->
                      <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#111827;line-height:1.3;letter-spacing:-0.3px;">{title}</h1>

                      <!-- Body -->
                      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#4b5563;">
                        {bodyHtml}
                      </div>

                      <!-- CTA button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
                        <tr>
                          <td style="background-color:#3b82f6;border-radius:8px;">
                            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{ctaUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="18%" stroke="f" fillcolor="#3b82f6"><w:anchorlock/><center><![endif]-->
                            <a href="{ctaUrl}" style="display:inline-block;padding:12px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;line-height:1.4;">{ctaText}</a>
                            <!--[if mso]></center></v:roundrect><![endif]-->
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:20px 40px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">

                      <!-- Fallback link -->
                      <p style="margin:0 0 16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9ca3af;line-height:1.5;">
                        Button not working? Copy and paste this link into your browser:<br>
                        <a href="{ctaUrl}" style="color:#6b7280;word-break:break-all;text-decoration:underline;">{ctaUrl}</a>
                      </p>

                      <!-- Disclaimer -->
                      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9ca3af;line-height:1.5;">
                        {disclaimer}
                      </p>

                    </td>
                  </tr>

                </table>
                <!-- /Card -->

              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </body>
        </html>
        """;
}
