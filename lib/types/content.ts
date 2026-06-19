export type ContentKey =
  | 'hero'
  | 'bench'
  | 'testimonials'
  | 'story'
  | 'heritage'
  | 'faq'
  | 'shipping'
  | 'returns'

export interface HeroContent {
  eyebrow:      string
  headline:     string
  italicWord:   string
  subtext:      string
  ctaPrimary:   { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  imageUrl:     string
}

export interface BenchContent {
  eyebrow:  string
  heading:  string
  linkText: string
  linkHref: string
}

export interface Testimonial {
  name:     string
  location: string
  quote:    string
}

export type TestimonialsContent = Testimonial[]

export interface StoryPillar {
  n:     string
  title: string
  body:  string
}

export interface StoryContent {
  headline: string
  intro:    string
  imageUrl: string
  pillars:  StoryPillar[]
}

export interface HeritageEntry {
  year:  string
  title: string
  body:  string
}

export interface HeritageProofPoint {
  n:     string
  title: string
  body:  string
}

export interface HeritageContent {
  heroHeadline:      string
  heroBody:          string
  heroImageUrl:      string
  workshopHeading:   string
  workshopBody1:     string
  workshopBody2:     string
  pressImageUrl:     string
  glasswareImageUrl: string
  proofPoints:       HeritageProofPoint[]
  entries:           HeritageEntry[]
}

export interface FaqQuestion {
  q: string
  a: string
}

export interface FaqCategory {
  category:  string
  questions: FaqQuestion[]
}

export type FaqContent = FaqCategory[]

export interface ShippingRow {
  zone:   string
  method: string
  time:   string
  rate:   string
}

export interface ShippingNote {
  title: string
  body:  string
}

export interface ShippingContent {
  rows:  ShippingRow[]
  notes: ShippingNote[]
}

export interface ReturnsSection {
  title: string
  body:  string
}

export interface ReturnsContent {
  lead:     string
  sections: ReturnsSection[]
}
