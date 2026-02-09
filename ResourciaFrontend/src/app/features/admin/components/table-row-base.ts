export abstract class TableRowBase {
  protected getChecked(ev: Event): boolean {
    return (ev.target as HTMLInputElement).checked;
  }
}
