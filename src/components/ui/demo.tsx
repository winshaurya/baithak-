"use client"

import { ShaderBackground } from "@/components/ui/halftone-dots"
import PushpinTearFooter from "@/components/ui/pushpin-tear-footer"

export function ShaderBackgroundDemo() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950">
      <ShaderBackground className="h-full w-full" />
    </div>
  )
}

export default function Demo() {
  return (
    <div className="w-full bg-slate-900">
      <PushpinTearFooter
        brand="baithak."
        name="baithak · intelligent ai notetaker"
        logoHref="#"
        sheet="#ffffff"
        paper="#ffffff"
        pinColor="#dc2626"
        sheetInk="#0f172a"
        paperInk="#0f172a"
        seed={42}
        socials={[]}
        columns={[]}
        newsletter={null}
        status={null}
        chat={null}
        sideLinks={[]}
        copyright="© 2026 Baithak · All rights reserved"
        credit="Speech Intelligence & Meeting Notes"
      />
    </div>
  )
}
