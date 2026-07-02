"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, TESTIMONIALS } from "../site.config";
import Reveal from "./Reveal";

export default function Reviews() {
  const t = useT();

  return (
    <section id="reviews" className="section section--muted">
      <div className="section__inner">
        <Reveal>
          <h2 className="section__heading">{t(COPY.reviews.heading)}</h2>
        </Reveal>

        <Reveal className="reviews-grid">
          {TESTIMONIALS.map((review, i) => (
            <blockquote
              className="review-card reveal-item"
              style={{ "--d": `${i * 90}ms` }}
              key={i}
            >
              <span className="review-card__stars" aria-hidden="true">
                ★★★★★
              </span>
              <p>&ldquo;{t(review.quote)}&rdquo;</p>
              <cite>— {review.author}</cite>
            </blockquote>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
