import Link from 'next/link'
import { Scale, Users, FileText, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ResolveIt</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Resolve Disputes with
            <span className="text-primary-600"> Expert Mediation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for resolving disputes through mediation with expert panels. 
            Get fair, transparent, and efficient resolution for family, business, and community disputes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
              Start Resolution Process
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How ResolveIt Works
          </h2>
          <p className="text-lg text-gray-600">
            Our structured mediation process ensures fair and transparent dispute resolution
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Register Your Case</h3>
            <p className="text-gray-600">
              Submit your dispute details, evidence, and opposite party information
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Expert Panel Creation</h3>
            <p className="text-gray-600">
              A panel of lawyers, religious scholars, and social experts is assigned
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Scale className="h-6 w-6 text-warning-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Virtual Mediation</h3>
            <p className="text-gray-600">
              Live discussions with professional mediators to find common ground
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fair Resolution</h3>
            <p className="text-gray-600">
              Formal agreements generated based on mediation outcomes
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Resolve Your Dispute?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands who have found fair resolution through our platform
          </p>
          <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-gray-100 btn text-lg px-8 py-3">
            Get Started Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Scale className="h-6 w-6 text-primary-400" />
              <span className="ml-2 text-lg font-semibold">ResolveIt</span>
            </div>
            <div className="text-gray-400">
              © 2024 ResolveIt. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}