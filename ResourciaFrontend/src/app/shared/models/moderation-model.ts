export interface ModerationModel {
    reason: string;
    durationDays?: number; // Ban doesn't need duration, but suspension does
}
