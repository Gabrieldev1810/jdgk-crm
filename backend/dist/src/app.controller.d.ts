export declare class AppController {
    getRoot(): {
        message: string;
        version: string;
        service: string;
        status: string;
        timestamp: string;
        endpoints: {
            health: string;
            docs: string;
            auth: string;
            users: string;
        };
        description: string;
    };
    getInfo(): {
        name: string;
        version: string;
        description: string;
        author: string;
        environment: string;
        port: string | number;
        database: string;
        features: string[];
    };
}
