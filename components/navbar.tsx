"use client"

import { Button } from "@/components/ui/button"
import { Heart, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Dia<span className="text-blue-600">beat</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About Diabeat
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-blue-600 transition-colors">
              FAQ
            </Link>
            <Link href="/assessment">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Start Assessment</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About Diabeat
              </Link>
              <Link href="/faq" className="text-gray-700 hover:text-blue-600 transition-colors">
                FAQ
              </Link>
              <Link href="/assessment">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full">Start Assessment</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
