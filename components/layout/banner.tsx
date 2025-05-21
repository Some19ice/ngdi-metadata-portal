"use server"

import Image from "next/image"
import Link from "next/link"

export default async function Banner() {
  return (
    <div className="flex h-[var(--banner-height)] items-center bg-slate-700 text-white">
      {" "}
      {/* Example styling */}
      <div className="container mx-auto flex items-center justify-center ">
        <Link href="/" className="flex items-center">
          <Image
            src="/img/logo.png"
            alt="NGDI Logo"
            width={100}
            height={40}
            className="mx-auto"
          />
        </Link>
        {/* You can add other elements to the banner here if needed */}
      </div>
    </div>
  )
}
