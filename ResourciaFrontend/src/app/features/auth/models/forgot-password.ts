/**
 * Payload for initiating a forgot-password request.
 */
export interface ForgotPasswordModel {
    /** Email address to send the reset link to. */
    email: string;
}
