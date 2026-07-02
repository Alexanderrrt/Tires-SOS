"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, TESTIMONIALS } from "../site.config";

export default function Reviews() {
  const t = useT();

  return (
    <section id="reviews" className="section section--muted">
      <div className="section__inner">
        <h2 className="section__heading">{t(COPY.reviews.heading)}</h2>

        <div className="reviews-grid">
          {TESTIMONIALS.map((review, i) => (
            <blockquote className="review-card" key={i}>
              <p>&ldquo;{t(review.quote)}&rdquo;</p>
              <cite>— {review.author}</cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
