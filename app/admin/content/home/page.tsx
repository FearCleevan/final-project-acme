import PageHeader from '@/components/admin/shared/PageHeader'

export default function ContentHomePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Content"
        subtitle="Edit storefront content — Home page, Testimonials, and more."
      />
      <p className="text-[13px] text-(--admin-text-muted) mt-4">
        Content editing pages are being set up. Check back shortly.
      </p>
    </div>
  )
}
