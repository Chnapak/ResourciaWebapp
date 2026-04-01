/**
 * Base class providing shared helpers for admin table row components.
 */
export abstract class TableRowBase {
  /** Extracts the checked state from a checkbox event. */
  protected getChecked(ev: Event): boolean {
    return (ev.target as HTMLInputElement).checked;
  }
}
