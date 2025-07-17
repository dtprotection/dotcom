import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="relative h-[70vh] w-full">
            <Image
              src="/placeholder.svg?height=1080&width=1920"
              alt="Elegant background"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="container absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/none">
              Professional <span className="text-amber-400">Security</span> Services for Any Occasion
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-lg text-zinc-200 md:text-xl">
              Down and Tight, We Get it Done Right!
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black">
                <Link href="/services">Our Services</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-amber-400 text-amber-400 hover:bg-amber-400/10"
              >
                <Link href="/about">About Us</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-24">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why Choose <span className="text-amber-500">Us</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              We deliver professional security services with uncompromising standards
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Unmatched Expertise",
                description: "Years of experience in executive protection and event security",
              },
              {
                title: "Professional Team",
                description: "Discreet, highly skilled and client-focused.",
              },
              {
                title: "Tailored Service",
                description: "Customized solutions to meet your specific needs",
              },
              {
                title: "24/7 Reliability",
                description: "Our team is always ready, ensuring your safety anytime, anywhere",
              },
              {
                title: "Competitive and Affordable Pricing",
                description: "We offer top-tier security services at fair and transparent rates",
              },
              {
                title: "We Are Insured",
                description: "A fully insured security firm backs your safety for added peace of mind.",
              },
              {
                title: "Willing to Travel",
                description: "Our team is available nation wide",
              },
              {
                title: "CPR Certified",
                description: "All team members are certified in CPR and first aid for emergency response",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center rounded-lg border border-amber-200/20 bg-zinc-50 p-8 text-center shadow-sm transition-all hover:border-amber-300/30 hover:shadow-md dark:bg-zinc-900"
              >
                <CheckCircle className="h-12 w-12 text-amber-500" />
                <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-black to-zinc-900 py-16 text-white">
          <div className="container flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div className="max-w-[600px]">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to <span className="text-amber-400">Transform</span> Your Experience?
              </h2>
              <p className="mt-4 text-zinc-300">
                Book a consultation today and discover how our services can benefit you.
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
