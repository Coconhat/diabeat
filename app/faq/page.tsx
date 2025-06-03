import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function FAQPage() {
  const faqs = [
    {
      question: "How accurate is the Diabeat risk assessment?",
      answer:
        "Our assessment is based on established medical guidelines and validated risk factors. However, it's designed as a screening tool and should not replace professional medical evaluation. The accuracy depends on the honesty and completeness of your responses.",
    },
    {
      question: "Is my personal information secure?",
      answer:
        "Yes, absolutely. Diabeat operates on a completely anonymous basis. We don't collect, store, or share any personal identifying information. Your responses are processed locally and are not linked to your identity in any way.",
    },
    {
      question: "How long does the assessment take?",
      answer:
        "The assessment typically takes 3-5 minutes to complete. It consists of 5 steps covering basic information, physical measurements, health metrics, lifestyle habits, and additional risk factors.",
    },
    {
      question: "What should I do if I receive a high-risk result?",
      answer:
        "If you receive a high-risk result, we strongly recommend consulting with a healthcare professional for proper evaluation and testing. Early detection and intervention can significantly reduce the risk of developing diabetes.",
    },
    {
      question: "Can I retake the assessment?",
      answer:
        "Yes, you can retake the assessment at any time. This might be useful if your health status, lifestyle, or other factors change over time. We recommend retaking it periodically to monitor changes in your risk profile.",
    },
    {
      question: "Is this assessment suitable for all ages?",
      answer:
        "The assessment is designed for adults aged 18 and older. Diabetes risk factors and assessment criteria can be different for children and adolescents, so we recommend consulting with a pediatric healthcare provider for younger individuals.",
    },
    {
      question: "What risk factors does the assessment consider?",
      answer:
        "Our assessment evaluates multiple risk factors including age, gender, BMI (calculated from height and weight), blood glucose levels, blood pressure, smoking status, physical activity level, sleep quality, and family history of diabetes.",
    },
    {
      question: "Do I need to know my exact glucose levels?",
      answer:
        "While knowing your exact glucose levels is helpful, the assessment provides options for different ranges and includes an 'I don't know' option. However, for the most accurate assessment, we recommend getting tested if you haven't had recent blood work.",
    },
    {
      question: "How often should I check my diabetes risk?",
      answer:
        "We recommend reassessing your diabetes risk annually, or more frequently if you experience significant changes in weight, lifestyle, or health status. Regular monitoring helps track changes in your risk profile over time.",
    },
    {
      question: "Is Diabeat a medical device or diagnostic tool?",
      answer:
        "No, Diabeat is not a medical device and does not provide medical diagnoses. It's an educational and informational tool designed to help you understand potential risk factors. Always consult healthcare professionals for medical advice and diagnosis.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600">
              Find answers to common questions about Diabeat and diabetes risk
              assessment.
            </p>
          </div>

          {/* FAQ Accordion */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                Common Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-gray-200 rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-blue-600">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="border-0 shadow-lg rounded-2xl mt-8 bg-blue-50">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h3>
              <p className="text-gray-600 mb-6">
                If you couldn't find the answer you're looking for, feel free to
                reach out to our support team.
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@diabeat.com
                </p>
                <p className="text-gray-700">
                  <strong>Phone:</strong> 1-800-DIABEAT
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
