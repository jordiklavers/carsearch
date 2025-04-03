import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function DebugPage() {
  const { toast } = useToast()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Toast Messages</CardTitle>
            <CardDescription>Test different types of toast notifications</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Success",
                    description: "This is a success message",
                  })
                }}
              >
                Show Success Toast
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Error",
                    description: "This is an error message",
                    variant: "destructive",
                  })
                }}
              >
                Show Error Toast
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "With Action",
                    description: "This toast has an action button",
                    action: (
                      <Button variant="outline" size="sm">
                        Undo
                      </Button>
                    ),
                  })
                }}
              >
                Show Toast with Action
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Long Message",
                    description: "This is a very long message that should wrap to multiple lines to test how the toast handles longer content. It should still look good and be readable.",
                  })
                }}
              >
                Show Long Toast
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Loading State",
                    description: "This toast shows a loading state",
                    action: (
                      <Button variant="outline" size="sm" disabled>
                        <span className="animate-spin mr-2">⌛</span>
                        Processing
                      </Button>
                    ),
                  })
                }}
              >
                Show Loading Toast
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "With Icon",
                    description: "This toast includes an icon",
                    action: (
                      <Button variant="outline" size="sm">
                        <span className="mr-2">🎉</span>
                        Celebrate
                      </Button>
                    ),
                  })
                }}
              >
                Show Toast with Icon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 