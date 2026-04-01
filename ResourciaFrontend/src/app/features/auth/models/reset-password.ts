/**
 * Payload for completing a password reset.
 */
export interface ResetPasswordModel {
    /** Reset token provided in the email link. */
    token: string;
    /** New password chosen by the user. */
    newPassword: string;
    /** Email address associated with the reset request. */
    email: string;
}
