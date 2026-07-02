import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Gallery from "./components/Gallery";
import Location from "./components/Location";
import Reviews from "./components/Reviews";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Gallery />
        <Location />
        <Reviews />
      </main>
      <Footer />
    </>
  );
}
