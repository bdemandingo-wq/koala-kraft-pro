import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Book, MessageCircle, Video, Mail, ExternalLink, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'How do I add a new staff member?',
    answer: 'Navigate to the Staff page from the sidebar. Click the "Add Staff" button and fill in the required information including name, email, phone, and assign the services they can perform.',
  },
  {
    question: 'How do I set up email notifications?',
    answer: 'Go to Settings > Notifications to configure your email preferences. You can enable/disable notifications for new bookings, cancellations, and reminders.',
  },
  {
    question: 'How do customers book appointments?',
    answer: 'Customers can book appointments through your public booking page. Share the link with your customers or embed it on your website. They can select a service, choose a date/time, and provide their contact information.',
  },
  {
    question: 'How do I view and manage bookings?',
    answer: 'You can view all bookings in two ways: 1) The Scheduler page shows a calendar view of all appointments. 2) The Bookings page shows a list view with filters and search functionality.',
  },
  {
    question: 'Can staff members log in to see their schedule?',
    answer: 'Yes! Staff members can log in with their email address. Once logged in, they will only see the bookings assigned to them and their personal schedule.',
  },
  {
    question: 'How do I change my pricing?',
    answer: 'Go to the Services page to manage your pricing. You can edit each service to update the price, duration, and other details. For square footage-based pricing, the rates are configured in your pricing sheet.',
  },
];

const resources = [
  { title: 'Getting Started Guide', icon: Book, description: 'Learn the basics of managing your bookings' },
  { title: 'Video Tutorials', icon: Video, description: 'Watch step-by-step video guides' },
  { title: 'Community Forum', icon: MessageCircle, description: 'Connect with other business owners' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      title="Help Center"
      subtitle="Get help and find answers to your questions"
    >
      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {resources.map((resource) => (
          <Card key={resource.title} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <resource.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Find answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredFaqs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No results found for "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription>Our support team is here to assist you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button className="gap-2">
              <Mail className="w-4 h-4" />
              Email Support
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Live Chat
            </Button>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
