import { Button } from '@/components/ui/button';

interface TransitionDemoProps {
  onNavigate: (page: string, transition?: string) => void;
}

const TransitionDemo = ({ onNavigate }: TransitionDemoProps) => {
  const demoPages = [
    { id: 'home', name: 'Home', transition: 'fade' },
    { id: 'courses', name: 'Courses', transition: 'slide-right' },
    { id: 'premium', name: 'Premium', transition: 'slide-left' },
    { id: 'about', name: 'About', transition: 'scale' },
    { id: 'help', name: 'Help', transition: 'slide-up' },
    { id: 'contact', name: 'Contact', transition: 'instant' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg" data-testid="transition-demo">
      <h3 className="text-sm font-semibold mb-3 text-foreground">🚀 Transition Demo</h3>
      <div className="grid grid-cols-2 gap-2">
        {demoPages.map((page) => (
          <Button
            key={page.id}
            variant="outline"
            size="sm"
            onClick={() => onNavigate(page.id, page.transition)}
            className="text-xs"
            data-testid={`transition-demo-${page.id}`}
          >
            {page.name}
            <br />
            <span className="text-[10px] opacity-70">{page.transition}</span>
          </Button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t">
        <p className="text-[10px] text-muted-foreground">
          Test ultra-fast transitions (0.2s loading)
        </p>
      </div>
    </div>
  );
};

export default TransitionDemo;
