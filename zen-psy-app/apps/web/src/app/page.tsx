import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Zen Psy App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A production-grade web application built with Next.js, TypeScript, 
            Prisma, and modern development practices.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Modern Stack</CardTitle>
              <CardDescription>
                Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• App Router with Server Components</li>
                <li>• Type-safe API with tRPC</li>
                <li>• Database with Prisma ORM</li>
                <li>• Authentication with NextAuth</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔒 Secure & Scalable</CardTitle>
              <CardDescription>
                Production-ready with security, monitoring, and best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Role-based access control</li>
                <li>• Input validation with Zod</li>
                <li>• Rate limiting & CORS</li>
                <li>• Comprehensive testing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🛠️ Developer Experience</CardTitle>
              <CardDescription>
                Optimized for productivity and maintainability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monorepo with Turborepo</li>
                <li>• ESLint + Prettier</li>
                <li>• Docker containerization</li>
                <li>• CI/CD with GitHub Actions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link href="/auth/signin">
            <Button size="lg" className="mr-4">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Demo Credentials</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Admin User</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">admin@zenpsy.com</p>
                <p className="text-sm text-gray-600">admin123!</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Regular User</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">user@zenpsy.com</p>
                <p className="text-sm text-gray-600">user123!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}