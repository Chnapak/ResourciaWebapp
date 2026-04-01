/**
 * Payload describing a filter reorder operation.
 */
export interface AdminFilterReorderModel {
    /** Id of the filter that moved. */
    movedId: string;
    /** Id of the filter that should appear above the moved item (null if last). */
    aboveId: string | null; // null if moved to the end
    /** Id of the filter that should appear below the moved item (null if first). */
    belowId: string | null; // null if moved to the start
}
