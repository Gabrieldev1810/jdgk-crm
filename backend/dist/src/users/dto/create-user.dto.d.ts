export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    isActive?: boolean;
}
export declare class UpdateUserDto {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: boolean;
}
