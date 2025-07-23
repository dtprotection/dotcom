import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, Clock, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-zinc-100 py-20 dark:bg-zinc-900">
          <div className="container flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                About <span className="text-amber-500">Us</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Born from experience <strong>D&T Executive Protection</strong> was founded to provide high-level
                security with a personal touch. Whether it's a private event or VIP Protection, we're here to keep you
                safe while ensuring peace of mind. Our team blends professionalism, discretion, and approachability -
                because security should make you feel protected, not pressured.
              </p>
            </div>
            <div className="relative h-[300px] w-full max-w-[500px] overflow-hidden rounded-lg shadow-xl lg:h-[400px]">
              <Image src="/executive_protection.JPG" alt="Our team" fill className="object-cover" />
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="container py-20">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Story</h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                <strong>D&T Executive Protection</strong> was founded by two lifelong friends with a shared mission:{" "}
                <strong>to make people feel safe without making them feel watched</strong>. After years of working in
                high-risk environments and witnessing how impersonal security could be, they decided to build a company
                rooted in both <strong>professionalism and people first service</strong>.
              </p>
              <p>
                What started as a few small event contracts has grown into a trusted name for event security and
                executive protection. With every job - whether it's a wedding, a high-profile function, or a private
                gathering - D&T brings calm, control, and a reassuring presence.{" "}
                <strong>We don't just show up in uniform; we show up with purpose.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-zinc-100 py-20 dark:bg-zinc-900">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl">Our Core Values</h2>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: <Award className="h-12 w-12 text-amber-500" />,
                  title: "Excellence",
                  description:
                    "We strive for excellence in everything we do, from the services we provide to the relationships we build.",
                },
                {
                  icon: <Users className="h-12 w-12 text-amber-500" />,
                  title: "Integrity",
                  description: "We conduct our business with honesty, transparency, and a strong ethical foundation.",
                },
                {
                  icon: <Clock className="h-12 w-12 text-amber-500" />,
                  title: "Reliability",
                  description:
                    "We deliver on our promises, ensuring consistency and dependability in all our services.",
                },
              ].map((value, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center rounded-lg border border-amber-200/20 bg-white p-8 text-center shadow-sm transition-all hover:border-amber-300/30 hover:shadow-md dark:bg-zinc-800"
                >
                  {value.icon}
                  <h3 className="mt-4 text-xl font-bold">{value.title}</h3>
                  <p className="mt-2 text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-black to-zinc-900 py-16 text-white">
          <div className="container flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div className="max-w-[600px]">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to Work <span className="text-amber-400">With Us</span>?
              </h2>
              <p className="mt-4 text-zinc-300">
                Discover how our services can transform your experience. Book a consultation today.
              </p>
            </div>
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black">
              <Link href="/services#booking" className="flex items-center gap-2">
                Book Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
