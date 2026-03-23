export interface AdminFilterReorderModel {
    movedId: string;
    aboveId: string | null; // null if moved to the end
    belowId: string | null; // null if moved to the start
}
