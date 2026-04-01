/**
 * Payload for user registration.
 */
export interface RegisterModel {
    /** Name displayed publicly for the user. */
    displayName: string;
    /** Email address for the new account. */
    email: string;
    /** Plain-text password entered by the user. */
    password: string;
    /** Password confirmation field. */
    confirmPassword: string;
    /** CAPTCHA token used for bot protection. */
    captchaToken: string;
}
