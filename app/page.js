import Header from "./components/Header";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Services from "./components/Services";
import Gallery from "./components/Gallery";
import Promos from "./components/Promos";
import OwnersRide from "./components/OwnersRide";
import Location from "./components/Location";
import Reviews from "./components/Reviews";
import Footer from "./components/Footer";
import BrandPopups from "./components/BrandPopups";
import ChatBot from "./components/ChatBot";
import CinematicVideo from "./components/CinematicVideo";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <CinematicVideo />
        <Services />
        <Gallery />
        <Promos />
        <OwnersRide />
        <Location />
        <Reviews />
      </main>
      <Footer />
      <BrandPopups />
      <ChatBot mode="shop" turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />
    </>
  );
}
