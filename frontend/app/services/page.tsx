import Image from "next/image"
import { ArrowRight } from "lucide-react"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BookingForm from "@/components/booking-form"

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-zinc-100 py-20 dark:bg-zinc-900">
          <div className="container text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              Our <span className="text-amber-500">Services</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-xl text-muted-foreground">
              Professional Security Tailored to Your Needs
            </p>
          </div>
        </section>

        {/* Services List */}
        <section className="container py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {[
              {
                title: "Personal Protection",
                description:
                  "Discreet and professional personal security services for individuals requiring enhanced safety measures.",
                features: ["Risk assessment", "Transportation security", "On-site protection"],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "Event Security",
                description:
                  "Comprehensive security planning and execution for corporate, private, and public events of all sizes.",
                features: ["Crowd management", "Entry control", "Emergency response"],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "Risk Assessment & Mitigation",
                description:
                  "Thorough evaluation of potential security threats with strategic planning to minimize risks.",
                features: [
                  "Comprehensive threat analysis",
                  "Strategic planning to mitigate risks effectively",
                  "Ongoing security consultation",
                ],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "Corporate Security",
                description:
                  "Tailored security solutions for corporate offices, business events, and executive protection needs.",
                features: [
                  "Office building security",
                  "Executive protection services",
                  "Ensuring a safe environment for employees and clients",
                ],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "Bar, Club, And Venue Security",
                description:
                  "Professional security presence for nightlife establishments and entertainment venues to maintain order and safety.",
                features: [
                  "Managing crowd control",
                  "De-escalating conflicts",
                  "Ensuring a safe experience for guests",
                ],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "Asset Protection",
                description:
                  "Comprehensive protection services for valuable assets including vehicles, equipment, and private property.",
                features: ["24/7 surveillance monitoring", "Regular patrol services", "Active deterrence measures"],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "Transportation Security",
                description:
                  "Secure escort and transportation services for high-value shipments, executives, and VIP clients.",
                features: [
                  "Secure vehicle escort services",
                  "Route planning and risk assessment",
                  "Trained professionals ensure safe travel with real-time risk assessment",
                ],
                image: "/placeholder.svg?height=400&width=600",
              },
              {
                title: "On-Site Protection",
                description:
                  "Dedicated close protection services for individuals at specific locations and designated venues.",
                features: [
                  "Personal bodyguard services",
                  "Venue security assessment",
                  "Ensuring personal safety at events, meetings, residences, or other venues",
                ],
                image: "/placeholder.svg?height=400&width=600",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="flex flex-col overflow-hidden rounded-lg border border-amber-200/20 bg-white shadow-sm transition-all hover:border-amber-300/30 hover:shadow-md dark:bg-zinc-950"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={service.image || "/placeholder.svg"} alt={service.title} fill className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <p className="mt-2 text-muted-foreground">{service.description}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What We Do Best Section */}
        <section className="bg-zinc-100 py-20 dark:bg-zinc-900">
          <div className="container">
            <div className="text-center">
              <div className="mb-8 text-lg font-semibold text-amber-500">WILLING TO TRAVEL / CPR CERTIFIED</div>
              <h2 className="mb-8 text-3xl font-bold tracking-tighter sm:text-4xl"> What We Do Best!</h2>
            </div>
            <div className="mx-auto max-w-4xl space-y-6 text-lg text-muted-foreground">
              <p>
                At <strong>D & T Executive Protection</strong>, we specialize in providing professional, reliable, and
                discreet security services tailored to meet the needs of individuals, businesses, and event organizers.
                From personal protection and corporate security to venue monitoring and property surveillance, our
                expert team is equipped to handle a wide range of security scenarios with precision and care.
              </p>
              <p>
                Our services go beyond simply having a presence—we plan, prepare, and execute strategic security
                measures designed to prevent threats before they happen. Whether you're hosting a large event, managing
                a high-profile client, protecting your business assets, or ensuring the safety of your nightlife venue,
                D & T has the experience and professionalism to get it done right.
              </p>
              <div className="text-center text-xl font-semibold text-amber-600">
                <p>
                  <strong>"Down and tight, we get it done right!"</strong>
                </p>
                <p>isn't just a slogan—it's the standard we live by.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Form */}
        <section id="booking" className="container py-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Book Your <span className="text-amber-500">Consultation</span>
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
                Take the first step towards securing your peace of mind
              </p>
            </div>
            <div className="mt-12">
              <BookingForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
