import { ContactBar } from "../src/components/ContactBar";
import HeroChapters from "../src/components/HeroChapters";
import HeroSequenceCanvas from "../src/components/HeroSequenceCanvas";
import ScrollCue from "../src/components/ScrollCue";
import ScrollProgress from "../src/components/ScrollProgress";

export default function HomePage() {
  return (
    <main>
      <ScrollProgress />
      <ContactBar />
      <ScrollCue />
      {/* 900vh runway: 0–10% mouse-driven, 10–100% scroll scrubs the transform
          sequence while six glass chapters fade in over it — see
          docs/hero-scroll-map.md for the exact ranges. */}
      <section className="relative h-[900vh]">
        <HeroSequenceCanvas />
        <HeroChapters />
      </section>
    </main>
  );
}
