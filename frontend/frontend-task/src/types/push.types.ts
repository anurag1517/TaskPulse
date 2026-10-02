export interface PushSubscriptionDTO {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
