import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image 
                src="/dt_logo.PNG" 
                alt="D&T Executive Protection" 
                width={120} 
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">Providing exceptional services and experiences since 2010.</p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-amber-500">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-amber-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-muted-foreground hover:text-amber-500">
                  Services
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Contact</h3>
            <ul className="space-y-2">
              {/* Street address commented out - no physical business address currently */}
              {/* <li className="text-sm text-muted-foreground">123 Business Street</li> */}
              <li className="text-sm text-muted-foreground">Fort Wayne, Indiana</li>
              <li className="text-sm text-muted-foreground">dtprotection74@gmail.com</li>
              <li className="text-sm text-muted-foreground">(260) 444-9099</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/p/D-and-T-Executive-Protection-LLC-61557405905101/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-amber-500"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              {/* Twitter and LinkedIn sections commented out - no active accounts for these platforms */}
              {/* <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-amber-500"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a> */}
              <a
                href="https://www.instagram.com/p/C23eoQ8LwHw/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-amber-500"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              {/* <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-amber-500"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a> */}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} D&T Executive Protection LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
