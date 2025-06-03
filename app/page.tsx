import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Users, Zap } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Dia<span className="text-blue-600">beat</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered diabetes screening for everyone. Get personalized
              insights about your diabetes risk in just 3 minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/assessment">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Start Assessment
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg rounded-xl"
              >
                Learn More
              </Button>
            </Link>
          </div>

          <div className="text-sm text-gray-500">
            ✓ Free & Anonymous ✓ Takes 3 minutes ✓ Clinically validated
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Diabeat?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI-powered assessment combines the latest research with
            personalized insights to help you understand your diabetes risk.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick & Easy</h3>
              <p className="text-gray-600 text-sm">
                Complete assessment in under 3 minutes with our streamlined
                questionnaire.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Clinically Validated
              </h3>
              <p className="text-gray-600 text-sm">
                Based on established medical guidelines and research studies.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Personalized</h3>
              <p className="text-gray-600 text-sm">
                Get tailored recommendations based on your unique health
                profile.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Privacy First
              </h3>
              <p className="text-gray-600 text-sm">
                Your data is anonymous and secure. We never store personal
                information.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-green-600 border-0 rounded-3xl">
          <CardContent className="p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Check Your Risk?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Take the first step towards better health. Our assessment is
              quick, free, and provides valuable insights.
            </p>
            <Link href="/assessment">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl shadow-lg"
              >
                Start Your Assessment Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
