import { AfterViewInit, Component, ElementRef, Input, input, QueryList, Renderer2, ViewChildren } from '@angular/core';

/**
 * Display model for a single chapter section on the home page.
 */
export interface ChapterItem {
  /** Section anchor id. */
  id: string;
  /** Display number (e.g., "01"). */
  number: string;
  /** Short label shown above headings. */
  label: string;
  /** Primary headline for the section. */
  heading: string;
  /** Secondary headline for the section. */
  subheading: string;
  /** Long-form body copy. */
  text: string;
}

/**
 * Scroll-animated list of chapter sections on the landing page.
 */
@Component({
  selector: 'app-chapter-section',
  imports: [],
  templateUrl: './chapter-section.component.html',
  styleUrl: './chapter-section.component.scss'
})
export class ChapterSectionComponent implements AfterViewInit {
  /** Sections to render in order. */
  @Input() items: ChapterItem[] = [];
  /** References to chapter DOM nodes for intersection observing. */
  @ViewChildren('chapter') chapters!: QueryList<ElementRef<HTMLElement>>;

  /** Observer used to trigger in-view animations. */
  private chapterObserver!: IntersectionObserver;

  /** Renderer is used to safely toggle classes on DOM nodes. */
  constructor(private renderer: Renderer2) {}

  /** Initialize intersection observers once the view is ready. */
  ngAfterViewInit(): void {
    this.setupChapterObserver();
    console.log("init done")
  }

  /** Create the observer that adds the in-view class when chapters enter viewport. */
  private setupChapterObserver(): void {
    this.chapterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            this.renderer.addClass(el, 'in-view');
            //this.setActive(el.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-5% 0px -30% 0px' }
    );
    
    // Start observing each chapter element after view init.
    this.chapters.forEach(chapter =>
      this.chapterObserver.observe(chapter.nativeElement)
    );
  }

}
