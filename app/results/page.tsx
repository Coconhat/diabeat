"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, CheckCircle, Heart, Mail, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const score = Number.parseInt(searchParams.get("score") || "0")
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: "Low", color: "green", description: "Your diabetes risk appears to be low." }
    if (score < 60)
      return { level: "Moderate", color: "yellow", description: "You may have a moderate risk for diabetes." }
    return { level: "High", color: "red", description: "You may be at higher risk for diabetes." }
  }

  const risk = getRiskLevel(score)

  const getRecommendations = (score: number) => {
    const recommendations = []

    if (score >= 60) {
      recommendations.push("Consult with a healthcare provider for professional evaluation")
      recommendations.push("Consider getting blood glucose testing done")
      recommendations.push("Implement immediate lifestyle changes")
    }

    if (score >= 30) {
      recommendations.push("Increase physical activity to at least 150 minutes per week")
      recommendations.push("Focus on a balanced diet with reduced sugar intake")
      recommendations.push("Monitor your weight and aim for a healthy BMI")
    }

    recommendations.push("Maintain regular sleep schedule (7-9 hours per night)")
    recommendations.push("Stay hydrated and limit processed foods")
    recommendations.push("Consider stress management techniques")

    return recommendations
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribed(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Diabetes Risk Assessment Results</h1>
            <p className="text-gray-600">
              Based on the information you provided, here's your personalized risk assessment.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Risk Score Card */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900">Risk Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                {/* Risk Meter */}
                <div className="relative">
                  <div className="w-48 h-48 mx-auto relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={risk.color === "green" ? "#10b981" : risk.color === "yellow" ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${score * 2.51} 251`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{score}</div>
                        <div className="text-sm text-gray-600">out of 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Level */}
                <div
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                    risk.color === "green"
                      ? "bg-green-100 text-green-800"
                      : risk.color === "yellow"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {risk.color === "green" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span className="font-semibold">{risk.level} Risk</span>
                </div>

                <p className="text-gray-600">{risk.description}</p>

                {/* Important Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> This assessment is for informational purposes only and should not
                    replace professional medical advice. Please consult with a healthcare provider for proper diagnosis
                    and treatment.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations Card */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  <span>Personalized Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getRecommendations(score).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="/assessment">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retake Assessment
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/resources">Learn More About Diabetes Prevention</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Signup Card */}
          <Card className="border-0 shadow-lg rounded-2xl mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">Stay Informed</CardTitle>
              <p className="text-gray-600">Get personalized tips and reminders to help manage your diabetes risk.</p>
            </CardHeader>
            <CardContent>
              {!subscribed ? (
                <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      <Mail className="w-4 h-4 mr-2" />
                      Get Health Tips & Reminders
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    We'll send you helpful tips and reminders. Unsubscribe anytime.
                  </p>
                </form>
              ) : (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you for subscribing!</h3>
                  <p className="text-gray-600">You'll receive helpful health tips and reminders in your inbox.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
