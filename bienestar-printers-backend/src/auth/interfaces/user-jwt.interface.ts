export class UserJwtPayload {
    sub: string;
    email: string;
    role: string;
    areaId?: string; // Legacy
    unitId?: string;
    departmentId?: string;
    regionId?: string;
}
