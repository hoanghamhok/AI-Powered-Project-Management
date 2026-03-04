import api from "../../../api/client"

export interface User {
    id: string;
    email: string;
    username: string;
    role: "USER" | "SUPER_ADMIN";
    createdAt: string;
}

export const getStats = async () => {
    // Mock stats for now since we don't have a specific stats endpoint yet, 
    // or we can calculate from users list
    const users = await getAllUsers();
    return {
        totalUsers: users.length,
        activeProjects: 0 // Placeholder
    };
};

export const getAllUsers = async (): Promise<User[]> => {
    const response = await api.get("/users/all");
    return response.data;
};

export const updateUserRole = async (userId: string, role: "USER" | "SUPER_ADMIN") => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
};
