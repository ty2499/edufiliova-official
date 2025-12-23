import { MegaMenu, MegaMenuItem, MegaMenuSection } from "./MegaMenu";
import { UsersRound, LifeBuoy, Newspaper, Mail, Plus, HelpCircle } from "lucide-react";

interface ResourcesMegaMenuProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export const ResourcesMegaMenu = ({ isOpen, onNavigate, onClose }: ResourcesMegaMenuProps) => {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const community = [
    {
      icon: <UsersRound className="h-5 w-5 " />,
      title: "Community",
      description: "Connect with other learners",
      page: "community",
    },
  ];

  const blog = [
    {
      icon: <Newspaper className="h-5 w-5 " />,
      title: "Blog",
      description: "Latest news and insights",
      page: "blog",
    },
  ];

  const help = [
    {
      icon: <LifeBuoy className="h-5 w-5 " />,
      title: "Help Center",
      description: "Find answers to your questions",
      page: "help",
    },
    {
      icon: <Mail className="h-5 w-5 " />,
      title: "Contact",
      description: "Get in touch with us",
      page: "contact",
    },
    {
      icon: <HelpCircle className="h-5 w-5 " />,
      title: "Report Issue",
      description: "Contact design team for issues",
      page: "design-team-contact",
    },
  ];

  return (
    <MegaMenu isOpen={isOpen}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <MegaMenuSection title="Community" icon={<UsersRound className="h-4 w-4 text-[#a0fab2]" />}>
          {community.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-community-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Blog" icon={<Newspaper className="h-4 w-4 text-[#a0fab2]" />}>
          {blog.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-blog-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>

        <MegaMenuSection title="Help" icon={<LifeBuoy className="h-4 w-4 text-[#a0fab2]" />}>
          {help.map((item, index) => (
            <MegaMenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => handleNavigate(item.page)}
              testId={`megamenu-help-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </MegaMenuSection>
      </div>
    </MegaMenu>
  );
};
