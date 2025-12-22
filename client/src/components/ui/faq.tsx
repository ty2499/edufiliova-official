import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: "What is EduFiliova?",
    answer: "EduFiliova is a comprehensive learning platform that connects students with expert educators, offering interactive courses, live tutoring, and a digital marketplace. Whether you're a student looking to learn or a creator wanting to teach, we provide all the tools you need to succeed."
  },
  {
    question: "How do I get started as a student?",
    answer: "Getting started is easy! Simply sign up for a free account, browse our extensive course library, and choose a subscription plan that fits your needs. You'll instantly get access to thousands of courses, live tutoring sessions, and our supportive learning community."
  },
  {
    question: "Can I become a teacher or course creator?",
    answer: "Absolutely! EduFiliova welcomes educators, professionals, and subject matter experts to create and sell courses. Sign up as a creator, build your courses using our intuitive tools, set your pricing, and start earning. We handle payments, hosting, and provide you with analytics to track your success."
  },
  {
    question: "What subscription plans are available?",
    answer: "We offer flexible subscription plans to suit different needs—from basic access to premium features including unlimited courses, one-on-one tutoring, downloadable resources, and priority support. Check our pricing page for detailed plan comparisons and choose what works best for you."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes! We offer a free trial period for new users to explore our platform, access select courses, and experience our learning environment. No credit card required to start your trial."
  },
  {
    question: "How does the digital marketplace work?",
    answer: "Our marketplace allows creators to sell digital products like study guides, templates, e-books, and course materials. Students can purchase these resources individually or access them through their subscription. Creators earn revenue while students get valuable learning materials."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards and various secure payment methods depending on your region. All transactions are secure and encrypted for your safety."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period, and there are no cancellation fees."
  }
]

export default function FAQ() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-6 md:px-10 lg:px-14 max-w-4xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-[40px] font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked <span className="dark:text-blue-400 text-foreground">Questions</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
            Find answers to common questions about EduFiliova
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4" data-testid="accordion-faq">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-6 transition-colors hover:border-[#0C332C]/50"
              data-testid={`accordion-item-${index}`}
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 dark:text-white transition-colors py-5" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0C332C'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
