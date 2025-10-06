export declare class RootController {
    getRoot(): {
        message: string;
        version: string;
        service: string;
        status: string;
        timestamp: string;
        endpoints: {
            api: string;
            health: string;
            docs: string;
            auth: string;
            users: string;
        };
        description: string;
    };
    getStatus(): {
        status: string;
        timestamp: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        version: string;
    };
}
