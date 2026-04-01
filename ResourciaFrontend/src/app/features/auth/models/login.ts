/**
 * Payload for user login.
 */
export interface LoginModel {
    /** Email address used to authenticate. */
    email: string,
    /** Plain-text password entered by the user. */
    password: string
}
