'use client'

import { UseFormRegister } from 'react-hook-form'
import { AdminProduct } from '@/lib/admin/types'
import SectionCard from '@/components/admin/shared/SectionCard'

interface Props {
  register: UseFormRegister<AdminProduct>
}

const input = 'w-full h-9 px-3 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors'
const label = 'block text-[11px] uppercase tracking-wide text-(--admin-text-muted) mb-1'
const groupHeading = 'text-[11px] uppercase tracking-wider text-(--admin-text-muted) mb-3 pb-2 border-b border-(--admin-border)'

function Field({ id, lbl, children }: { id: string; lbl: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{lbl}</label>
      {children}
    </div>
  )
}

export default function MetafieldFields({ register }: Props) {
  return (
    <SectionCard>
      <p className="text-[13px] font-semibold text-(--admin-text) mb-0.5">Product Metafields</p>
      <p className="text-[11px] text-(--admin-text-muted) mb-5">
        acme.* namespace — synced to Shopify in Plan 2
      </p>

      <div className="space-y-6">

        {/* Identification */}
        <div>
          <p className={groupHeading}>Identification</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="brand" lbl="Brand">
              <input id="brand" {...register('brand')} className={input} placeholder="The Oil Lamp Company" />
            </Field>
            <Field id="vintage" lbl="Vintage">
              <input id="vintage" {...register('vintage')} className={input} placeholder="Reproduction / Antique" />
            </Field>
            <Field id="patent" lbl="Patent">
              <input id="patent" {...register('patent')} className={input} placeholder="Pat. 12345" />
            </Field>
          </div>
        </div>

        {/* Physical */}
        <div>
          <p className={groupHeading}>Physical</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="material" lbl="Material">
              <input id="material" {...register('material')} className={input} placeholder="Glass" />
            </Field>
            <Field id="colour" lbl="Colour">
              <input id="colour" {...register('colour')} className={input} placeholder="Powder Blue" />
            </Field>
            <Field id="style" lbl="Style">
              <input id="style" {...register('style')} className={input} placeholder="Victorian" />
            </Field>
          </div>
        </div>

        {/* Lamp Specs */}
        <div>
          <p className={groupHeading}>Lamp Specs</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="burnerSize" lbl="Burner Size">
              <input id="burnerSize" {...register('burnerSize')} className={input} placeholder="No. 2 Duplex" />
            </Field>
            <Field id="fits" lbl="Fits">
              <input id="fits" {...register('fits')} className={input} placeholder={`5 1/4" shade ring`} />
            </Field>
            <Field id="powerSource" lbl="Power Source">
              <input id="powerSource" {...register('powerSource')} className={input} placeholder="Oil" />
            </Field>
            <Field id="era" lbl="Era">
              <input id="era" {...register('era')} className={input} placeholder="Victorian" />
            </Field>
          </div>
        </div>

        {/* Condition */}
        <div>
          <p className={groupHeading}>Condition</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="condition" lbl="Condition">
              <input id="condition" {...register('condition')} className={input} placeholder="New / Good / Fair" />
            </Field>
            <Field id="productType" lbl="Product Type">
              <input id="productType" {...register('productType')} className={input} placeholder="Shade / Chimney / Burner" />
            </Field>
            <Field id="edition" lbl="Edition">
              <input id="edition" {...register('edition')} className={input} placeholder="First Edition" />
            </Field>
          </div>
        </div>

        {/* Provenance */}
        <div>
          <p className={groupHeading}>Provenance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="workshop" lbl="Workshop">
              <input id="workshop" {...register('workshop')} className={input} placeholder="Acme Workshop" />
            </Field>
            <Field id="benchTester" lbl="Bench Tester">
              <input id="benchTester" {...register('benchTester')} className={input} placeholder="PPlazan" />
            </Field>
            <Field id="benchTestDate" lbl="Bench Test Date">
              <input id="benchTestDate" {...register('benchTestDate')} type="date" className={input} />
            </Field>
          </div>
        </div>

        {/* Full Description */}
        <div>
          <p className={groupHeading}>Description</p>
          <Field id="fullDescription" lbl="Full Description">
            <textarea
              id="fullDescription"
              {...register('fullDescription')}
              rows={6}
              className="w-full px-3 py-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md resize-y focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors"
              placeholder="A superb reproduction made in the tradition of the original antique shade…"
            />
          </Field>
        </div>

      </div>
    </SectionCard>
  )
}
