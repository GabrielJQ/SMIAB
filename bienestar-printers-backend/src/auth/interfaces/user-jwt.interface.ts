export class UserJwtPayload {
    sub: string;
    email: string;
    role: string;
    areaId?: string; // Custom claim from Supabase or added by middleware
    // Add other properties as needed
}
