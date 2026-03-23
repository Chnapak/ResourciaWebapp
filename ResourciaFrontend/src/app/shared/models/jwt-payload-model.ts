export interface JwtPayloadModel {
    id: string; // user ID
    email: string;
    name: string;
    exp: number; // expiration time (timestamp)
    isAdmin?: boolean; // optional, can be set based on user roles/permissions

    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string[]; // optional, for roles if included in JWT
}
