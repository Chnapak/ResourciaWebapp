import { AfterViewInit, Component, ElementRef, QueryList, Renderer2, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-chapter-section',
  imports: [],
  templateUrl: './chapter-section.component.html',
  styleUrl: './chapter-section.component.scss'
})
export class ChapterSectionComponent implements AfterViewInit {
  @ViewChildren('chapter') chapters!: QueryList<ElementRef<HTMLElement>>;

  private chapterObserver!: IntersectionObserver;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.setupChapterObserver();
    console.log("init done")
  }

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
    
    this.chapters.forEach(chapter =>
      this.chapterObserver.observe(chapter.nativeElement)
    );
  }

}
