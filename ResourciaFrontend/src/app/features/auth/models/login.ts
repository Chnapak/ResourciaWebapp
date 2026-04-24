/**
 * Payload for user login.
 */
export interface LoginModel {
    /** Email address used to authenticate. */
    email: string,
    /** Plain-text password entered by the user. */
    password: string,
    /** Optional Turnstile token captured by the frontend. */
    captchaToken?: string | null
}
