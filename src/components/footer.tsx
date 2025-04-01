// src/components/footer.tsx
import Link from "next/link"
import { Facebook, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-2">
            <h3 className="font-title text-2xl font-bold text-primary mb-4">
              SereniBook
            </h3>
            <p className="text-gray-600 mb-4">
              La solution simple et intuitive pour la gestion de vos rendez-vous bien-être.
              Connectez-vous avec vos clients et développez votre activité sereinement.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex items-center space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link 
                  href="/tarifs" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Tarifs
                </Link>
              </li>
              <li>
                <Link 
                  href="/fonctionnalites" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/mentions-legales" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link 
                  href="/confidentialite" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link 
                  href="/cgv" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  CGV
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-12 pt-8 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} SereniBook. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}