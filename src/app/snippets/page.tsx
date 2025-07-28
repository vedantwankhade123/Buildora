
"use client";

import { useState, useMemo, useEffect } from 'react';
import { SnippetCard, type Snippet } from '@/components/snippet-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

const sampleSnippets: Snippet[] = [
  {
    id: '1',
    title: 'Responsive Navbar',
    category: 'Navigation',
    description: 'A clean, responsive navigation bar with a logo, links, and a call-to-action button. Collapses into a hamburger menu on mobile.',
    code: `<nav class="bg-white shadow-md p-4 flex justify-between items-center">
  <div class="text-xl font-bold text-gray-800">YourLogo</div>
  <div class="hidden md:flex items-center gap-6">
    <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">Home</a>
    <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">Features</a>
    <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">Pricing</a>
    <a href="#" class="text-gray-600 hover:text-blue-500 transition-colors">About</a>
  </div>
  <div class="hidden md:flex items-center gap-4">
    <a href="#" class="text-gray-600 hover:text-blue-500 font-medium">Log In</a>
    <button class="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105">Sign Up</button>
  </div>
  <button class="md:hidden text-gray-800">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  </button>
</nav>`,
  },
  {
    id: '2',
    title: 'Hero Section with Image',
    category: 'Marketing',
    description: 'A modern hero section with a compelling headline, supporting text, call-to-action buttons, and a placeholder image.',
    code: `<section class="bg-gray-50">
  <div class="container mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
    <div class="text-center md:text-left">
      <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">Build Your Next Idea Faster</h1>
      <p class="text-lg text-gray-600 mb-8">The ultimate toolkit for turning your ideas into beautiful, functional web applications with the power of AI.</p>
      <div class="flex justify-center md:justify-start gap-4">
        <button class="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all">Get Started</button>
        <button class="bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-200 transition-all">Learn More</button>
      </div>
    </div>
    <div>
      <img src="https://placehold.co/600x400.png" alt="Product screenshot" class="rounded-lg shadow-2xl" data-ai-hint="abstract technology">
    </div>
  </div>
</section>`,
  },
  {
    id: '3',
    title: 'Three-Tier Pricing Table',
    category: 'Marketing',
    description: 'A responsive pricing table with three distinct plans, a list of features, and a highlighted "Most Popular" option.',
    code: `<div class="bg-white py-12">
  <div class="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    
    <div class="border border-gray-200 p-8 rounded-xl shadow-lg flex flex-col">
      <h3 class="text-2xl font-semibold text-gray-800 mb-4">Starter</h3>
      <p class="text-gray-500 mb-6">For individuals and small projects.</p>
      <p class="text-5xl font-bold text-gray-900 mb-6">$19<span class="text-xl font-medium text-gray-500">/mo</span></p>
      <ul class="space-y-4 text-gray-600 mb-8 flex-grow">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>10 Projects</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Basic Analytics</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Email Support</li>
      </ul>
      <button class="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors">Choose Plan</button>
    </div>

    <div class="border-2 border-blue-500 p-8 rounded-xl shadow-2xl flex flex-col relative">
      <span class="bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full absolute -top-4 right-6">Most Popular</span>
      <h3 class="text-2xl font-semibold text-gray-800 mb-4">Pro</h3>
      <p class="text-gray-500 mb-6">For growing teams and businesses.</p>
      <p class="text-5xl font-bold text-gray-900 mb-6">$49<span class="text-xl font-medium text-gray-500">/mo</span></p>
      <ul class="space-y-4 text-gray-600 mb-8 flex-grow">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Unlimited Projects</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Advanced Analytics</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Priority Support</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>API Access</li>
      </ul>
      <button class="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors">Choose Plan</button>
    </div>

    <div class="border border-gray-200 p-8 rounded-xl shadow-lg flex flex-col">
      <h3 class="text-2xl font-semibold text-gray-800 mb-4">Enterprise</h3>
      <p class="text-gray-500 mb-6">For large-scale organizations.</p>
      <p class="text-5xl font-bold text-gray-900 mb-6">Custom</p>
      <ul class="space-y-4 text-gray-600 mb-8 flex-grow">
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Dedicated Infrastructure</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>24/7 Support</li>
        <li class="flex items-center gap-3"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Custom Integrations</li>
      </ul>
      <button class="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors">Contact Us</button>
    </div>
  </div>
</div>`,
  },
  {
    id: '4',
    title: 'Modern Login Form',
    category: 'Forms',
    description: 'A sleek, centered login form with social login options and a clean design, perfect for any application.',
    code: `<div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
  <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
    <h2 class="text-3xl font-bold text-gray-800 text-center mb-2">Welcome Back</h2>
    <p class="text-center text-gray-500 mb-8">Sign in to continue to your account.</p>
    <form class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
        <input type="email" id="email" class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com">
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" id="password" class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••">
      </div>
      <div class="flex items-center justify-between">
        <a href="#" class="text-sm text-blue-600 hover:underline">Forgot password?</a>
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Log In</button>
    </form>
    <div class="mt-8 text-center text-gray-500">
      Don't have an account? <a href="#" class="text-blue-600 font-semibold hover:underline">Sign up</a>
    </div>
  </div>
</div>`,
  },
  {
    id: '5',
    title: 'Feature Section with Icons',
    category: 'Content',
    description: 'A section to highlight key features, using a grid layout with icons, titles, and descriptions for a clear presentation.',
    code: `<section class="bg-white py-20">
  <div class="container mx-auto px-6">
    <div class="text-center mb-12">
      <h2 class="text-4xl font-bold text-gray-900">Why Our Product is The Best</h2>
      <p class="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Discover the powerful features that make our tool a game-changer for developers and designers.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-10">
      <div class="text-center p-6">
        <div class="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <h3 class="text-2xl font-semibold text-gray-800 mb-3">Lightning Fast</h3>
        <p class="text-gray-600">Generate complex UIs in seconds, not hours. Our AI is optimized for speed and efficiency.</p>
      </div>
      <div class="text-center p-6">
        <div class="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mx-auto mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        </div>
        <h3 class="text-2xl font-semibold text-gray-800 mb-3">Fully Responsive</h3>
        <p class="text-gray-600">All generated code is mobile-first and looks great on any device, from phones to desktops.</p>
      </div>
      <div class="text-center p-6">
        <div class="flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 text-purple-600 mx-auto mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
        </div>
        <h3 class="text-2xl font-semibold text-gray-800 mb-3">Highly Customizable</h3>
        <p class="text-gray-600">Easily enhance and modify your designs with simple text prompts. Your imagination is the only limit.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: '6',
    title: 'Testimonial Card',
    category: 'Cards',
    description: 'A stylish card to display customer testimonials, featuring a quote, avatar, name, and title. Perfect for building social proof.',
    code: `<div class="bg-gray-100 p-12 flex items-center justify-center">
  <div class="bg-white rounded-xl shadow-lg p-8 max-w-lg">
    <img src="https://placehold.co/100x100.png" alt="User avatar" class="w-24 h-24 rounded-full mx-auto -mt-20 border-8 border-white" data-ai-hint="person smiling">
    <p class="text-xl text-gray-600 italic mt-6 mb-6">"This tool has completely changed my workflow. I can now prototype and iterate on designs faster than ever before. It's an indispensable part of my toolkit."</p>
    <div class="text-center">
      <p class="font-bold text-lg text-gray-800">Sarah Johnson</p>
      <p class="text-gray-500">Lead Designer at Innovate Co.</p>
    </div>
  </div>
</div>`
  },
  {
    id: '7',
    title: 'Simple Contact Form',
    category: 'Forms',
    description: 'A clean and straightforward contact form with fields for name, email, and message.',
    code: `<div class="bg-gray-50 p-8">
  <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
    <form>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Your Name">
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="Your Email">
      </div>
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="message">Message</label>
        <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32" id="message" placeholder="Your Message"></textarea>
      </div>
      <div class="flex items-center justify-between">
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
          Send Message
        </button>
      </div>
    </form>
  </div>
</div>`
  },
  {
    id: '8',
    title: 'FAQ Section (Accordion)',
    category: 'Content',
    description: 'An accordion-style FAQ section. Note: Requires JavaScript to toggle visibility.',
    code: `<div class="max-w-3xl mx-auto p-8">
  <h2 class="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
  <div class="space-y-4">
    <div>
      <h3 class="font-semibold text-lg cursor-pointer">What is included in the Pro plan?</h3>
      <p class="text-gray-600 mt-2">The Pro plan includes unlimited projects, advanced analytics, priority support, and API access.</p>
    </div>
    <div class="border-t pt-4">
      <h3 class="font-semibold text-lg cursor-pointer">Can I change my plan later?</h3>
      <p class="text-gray-600 mt-2">Yes, you can upgrade or downgrade your plan at any time from your account settings.</p>
    </div>
    <div class="border-t pt-4">
      <h3 class="font-semibold text-lg cursor-pointer">Do you offer a free trial?</h3>
      <p class="text-gray-600 mt-2">We do not have a free trial, but we offer a 14-day money-back guarantee on all plans.</p>
    </div>
  </div>
</div>`
  },
  {
    id: '9',
    title: 'Simple Footer',
    category: 'Navigation',
    description: 'A clean footer with social media links and copyright information.',
    code: `<footer class="bg-gray-800 text-white p-6">
  <div class="container mx-auto flex justify-between items-center">
    <p>&copy; 2024 Your Company. All rights reserved.</p>
    <div class="flex gap-4">
      <a href="#" class="hover:text-gray-400">Twitter</a>
      <a href="#" class="hover:text-gray-400">LinkedIn</a>
      <a href="#" class="hover:text-gray-400">GitHub</a>
    </div>
  </div>
</footer>`
  },
  {
    id: '10',
    title: 'Stats Section',
    category: 'Marketing',
    description: 'A section to display key statistics or metrics in a visually appealing way.',
    code: `<section class="bg-white py-16">
  <div class="container mx-auto px-6 text-center">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div>
        <p class="text-4xl font-bold text-blue-600">10,000+</p>
        <p class="text-gray-500 mt-2">Happy Customers</p>
      </div>
      <div>
        <p class="text-4xl font-bold text-blue-600">500k+</p>
        <p class="text-gray-500 mt-2">Designs Generated</p>
      </div>
      <div>
        <p class="text-4xl font-bold text-blue-600">99%</p>
        <p class="text-gray-500 mt-2">Uptime</p>
      </div>
      <div>
        <p class="text-4xl font-bold text-blue-600">24/7</p>
        <p class="text-gray-500 mt-2">Support</p>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: '11',
    title: 'Image Gallery',
    category: 'Content',
    description: 'A responsive grid-based image gallery.',
    code: `<div class="container mx-auto p-4">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="grid gap-4">
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x600.png" data-ai-hint="nature landscape" alt=""></div>
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x400.png" data-ai-hint="city architecture" alt=""></div>
    </div>
    <div class="grid gap-4">
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x400.png" data-ai-hint="abstract art" alt=""></div>
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x600.png" data-ai-hint="people portrait" alt=""></div>
    </div>
    <div class="grid gap-4">
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x600.png" data-ai-hint="animal wildlife" alt=""></div>
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x400.png" data-ai-hint="food photography" alt=""></div>
    </div>
    <div class="grid gap-4">
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x400.png" data-ai-hint="technology gadgets" alt=""></div>
      <div><img class="h-auto max-w-full rounded-lg" src="https://placehold.co/400x600.png" data-ai-hint="travel destination" alt=""></div>
    </div>
  </div>
</div>`
  },
  {
    id: '12',
    title: 'Call to Action Section',
    category: 'Marketing',
    description: 'A prominent call-to-action (CTA) section to encourage user engagement.',
    code: `<section class="bg-blue-600 text-white">
  <div class="container mx-auto px-6 py-16 text-center">
    <h2 class="text-3xl font-bold mb-4">Ready to Dive In?</h2>
    <p class="text-blue-200 text-lg mb-8">Start building your next project today.</p>
    <button class="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-blue-100 transition-colors">
      Get Started Now
    </button>
  </div>
</section>`
  }
];

const SNIPPETS_STORAGE_KEY = 'all-snippets';

export default function SnippetsPage() {
  const { user, isCheckingAuth } = useUser();
  const [showAuth, setShowAuth] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = theme;
    const storedSnippetsJSON = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (storedSnippetsJSON) {
      setSnippets(JSON.parse(storedSnippetsJSON));
    } else {
      setSnippets(sampleSnippets);
      localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(sampleSnippets));
    }
  }, []);
  const categories = useMemo(() => {
    const allCategories = new Set(snippets.map(s => s.category));
    return ['All', ...Array.from(allCategories)];
  }, [snippets]);
  const filteredSnippets = useMemo(() => {
    return snippets.filter(snippet => {
      const matchesCategory = selectedCategory === 'All' || snippet.category === selectedCategory;
      const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) || snippet.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, snippets]);
  if (isCheckingAuth) {
    return <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-white text-xl font-bold">Loading...</div>;
  }
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
        <h2 className="text-2xl font-bold mb-4">Sign in to access the Snippet Library</h2>
        <Button onClick={() => setShowAuth(true)} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg">Sign In / Sign Up</Button>
        {/* Optionally, render the AuthModalForm here or trigger the global modal */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 pt-16">
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Go Back</span>
              </Link>
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl lg:text-4xl font-bold font-headline tracking-tight mb-2 bg-gradient-to-r from-primary to-blue-400 text-transparent bg-clip-text font-extrabold">Component Library</h1>
              <p className="text-muted-foreground">
                A collection of ready-to-use components for your projects.
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search"
              placeholder="Search components..."
              className="pl-10 bg-zinc-900 text-white border border-zinc-800 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/60 focus:ring-offset-0 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-12">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={cn("rounded-full border border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white transition-colors", selectedCategory === category && "bg-zinc-800 text-white")}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        {filteredSnippets.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredSnippets.map(snippet => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-foreground">No components found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your search or category filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
