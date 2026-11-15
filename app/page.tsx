import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";
import { Closing } from "@/components/sections/Closing";
import { T } from "@/lib/tuning";

function Gap() {
  return (
    <div aria-hidden="true" style={{ height: `calc(var(--vh) * ${T.gapVh})` }} />
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Gap />
      <Projects />
      <Gap />
      <About />
      <Gap />
      <Skills />
      <Gap />
      <Contact />
      <Gap />
      <Closing />
    </>
  );
}
