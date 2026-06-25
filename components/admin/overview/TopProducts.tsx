import SectionCard from '@/components/admin/shared/SectionCard'
import TopProductsTable from '@/components/admin/charts/TopProductsTable'
import { getCachedAnalytics } from '@/lib/admin/overviewCache'

export default async function TopProducts() {
  const analytics = await getCachedAnalytics()

  return (
    <SectionCard>
      <TopProductsTable products={analytics.topProducts} />
    </SectionCard>
  )
}
