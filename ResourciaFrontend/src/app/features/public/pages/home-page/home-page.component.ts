import { AfterViewInit, Component, ElementRef, QueryList, Renderer2, ViewChildren } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { HeroBannerComponent } from "./components/hero-banner/hero-banner.component";
import { ChapterSectionComponent } from "./components/chapter-section/chapter-section.component";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [RouterOutlet, HeroBannerComponent, ChapterSectionComponent],
  templateUrl: "./home-page.component.html",
  styleUrl: "./home-page.component.scss"
})
export class HomePageComponent {
  chapters = [
    {
      id: "problem",
      number: "01",
      label: "The Problem",
      heading: "The internet is full of options",
      subheading: "but not enough answers.",
      text: "The internet has become the backbone of modern education, connecting learners to an unprecedented wealth of information and tools. From online courses and interactive simulations to research databases and collaborative platforms, it enables learning anytime, anywhere. Yet despite this potential, finding the right resources remains surprisingly difficult. Students, teachers, and lifelong learners often spend hours sifting through unreliable, outdated, or overly complex materials. The sheer volume of options can be overwhelming, and without clear guidance, quality resources are easily overlooked. Learning should\'t depend on luck but too often, it does."
    },
    {
      id: "solution",
      number: "02",
      label: "What We Do",
      heading: "We\'ve already done",
      subheading: "the homework for you.",
      text: "Resourcia is a web app designed to make self-study simple and effective. We carefully curate, organize, and surface the best educational resources across subjects and formats, so students can discover tools that truly help them learn. Each resource can be reviewed and rated by learners, giving honest feedback on quality, clarity, and usefulness. By combining expert curation with community insights, Resourcia helps students focus on learning, not searching, while providing a trusted space to explore, compare, and track the resources that work best for them."
    },
    {
      id: "audience",
      number: "03",
      label: "Who It\'s For",
      heading: "Built for every stage",
      subheading: "of the learning journey.",
      text: "Resourcia is built for every stage of the learning journey. Teachers can quickly find trusted materials for their lessons, students can explore topics in ways that match their learning style, and lifelong learners can easily discover resources to fuel their curiosity. We don’t believe that age, experience, or background should filter what resources you can access. High-quality education should be open to everyone. No matter your stage or subject area, Resourcia adapts to your needs, making learning truly accessible and empowering for all."
    },
    {
      id: "vision",
      number: "04",
      label: "Our Vision",
      heading: "Access to great learning",
      subheading: "should be universal.",
      text: "Education is a fundamental human right, recognized by the United Nations, yet millions of children still lack access to quality learning opportunities. The internet has become the frontier to change that, offering a way to reach underprivileged students with the resources they need to learn, grow, and succeed. Resourcia is built on the principle of mutual help: it is open-source, powered by community contributions, and driven by learners and educators who share the resources they find valuable. Every resource gathered by users is freely available to anyone, ensuring that high-quality education remains open to all. We don’t believe that age, experience, or background should limit access. Resourcia harnesses the power of the web and the community to make learning truly inclusive, collaborative, and free."
    }
  ];
}

