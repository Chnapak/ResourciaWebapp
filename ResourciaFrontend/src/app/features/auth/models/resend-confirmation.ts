/**
 * Payload for resending an email confirmation link.
 */
export interface ResendConfirmationModel {
    /** Email address to resend confirmation to. */
    email: string;
}
