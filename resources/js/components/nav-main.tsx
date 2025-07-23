import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(items.map(item => item.title)));

    const handleToggle = (itemTitle: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemTitle)) {
                newSet.delete(itemTitle);
            } else {
                newSet.add(itemTitle);
            }
            return newSet;
        });
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
                {items.map((item, itemIndex) => {
                    const isExpanded = expandedItems.has(item.title);

                    if (item.items && item.items.length > 0) {
                        // Item with subitems
                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                open={isExpanded}
                                onOpenChange={() => handleToggle(item.title)}
                            >
                                                                <SidebarMenuItem
                                    className="animate-in fade-in-0 slide-in-from-left-2"
                                    style={{ animationDelay: `${itemIndex * 75}ms` }}
                                >
                                    <CollapsibleTrigger asChild>
                                                                                <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            className="group"
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className={`ml-auto transition-transform duration-300 ease-out ${isExpanded ? 'rotate-90' : ''}`} />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 overflow-hidden">
                                        <SidebarMenuSub className="ml-4 border-l-2 border-gray-100 pl-4 mt-2 space-y-1">
                                            {item.items.map((subItem, subIndex) => (
                                                                                                <SidebarMenuSubItem
                                                    key={subItem.title}
                                                    className="animate-in fade-in-0 slide-in-from-left-1"
                                                    style={{ animationDelay: `${(itemIndex * 75) + (subIndex * 50)}ms` }}
                                                >
                                                                                                        <SidebarMenuSubButton
                                                        asChild
                                                        isActive={subItem.href ? page.url.startsWith(subItem.href) : false}
                                                        className="group data-[active=true]:bg-blue-100 data-[active=true]:border-l-2 data-[active=true]:border-l-blue-500 data-[active=true]:shadow-sm"
                                                    >
                                                        <Link href={subItem.href || '#'} prefetch>
                                                            {subItem.icon && (
                                                                <subItem.icon className="data-[active=true]:text-blue-600" />
                                                            )}
                                                            <span className="data-[active=true]:text-blue-900 data-[active=true]:font-medium">
                                                                {subItem.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    } else {
                        // Regular item
                        return (
                                                        <SidebarMenuItem
                                key={item.title}
                                className="animate-in fade-in-0 slide-in-from-left-2"
                                style={{ animationDelay: `${itemIndex * 75}ms` }}
                            >
                                                                <SidebarMenuButton
                                    asChild
                                    isActive={item.href ? page.url.startsWith(item.href) : false}
                                    tooltip={{ children: item.title }}
                                    className="group data-[active=true]:bg-blue-100 data-[active=true]:shadow-sm"
                                >
                                    <Link href={item.href || '#'} prefetch>
                                        {item.icon && (
                                            <item.icon className="data-[active=true]:text-blue-600" />
                                        )}
                                        <span className="data-[active=true]:text-blue-900 data-[active=true]:font-medium">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
