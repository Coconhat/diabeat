import { Card, CardContent } from "@/components/ui/card"
import { Heart, Shield, Users, Zap } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About Diabeat</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Empowering individuals with AI-powered diabetes risk assessment tools for better health outcomes and
              preventive care.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="border-0 shadow-lg rounded-2xl mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                Diabetes affects millions of people worldwide, yet many cases could be prevented with early detection
                and lifestyle changes. Diabeat was created to make diabetes risk assessment accessible, accurate, and
                actionable for everyone. Our AI-powered tool combines the latest medical research with personalized
                insights to help individuals understand their risk and take proactive steps toward better health.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Evidence-Based Assessment</h3>
                <p className="text-gray-600">
                  Our assessment is based on established medical guidelines and validated risk factors recognized by
                  leading health organizations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy & Security</h3>
                <p className="text-gray-600">
                  Your health information is completely anonymous and secure. We never store personal data or share
                  information with third parties.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personalized Insights</h3>
                <p className="text-gray-600">
                  Receive tailored recommendations based on your unique health profile and risk factors to help you make
                  informed decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Accessible Healthcare</h3>
                <p className="text-gray-600">
                  Making diabetes risk assessment available to everyone, regardless of location or healthcare access, to
                  promote preventive care.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <Card className="border-0 shadow-lg rounded-2xl bg-yellow-50 border-yellow-200">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Important Medical Disclaimer</h3>
              <p className="text-gray-700 leading-relaxed">
                Diabeat is designed for informational and educational purposes only. This tool is not intended to
                diagnose, treat, cure, or prevent any disease, nor should it be used as a substitute for professional
                medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals
                regarding any health concerns or before making any decisions related to your health or treatment. If you
                have symptoms or concerns about diabetes, please seek immediate medical attention.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
