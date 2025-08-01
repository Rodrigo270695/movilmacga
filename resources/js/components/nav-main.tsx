import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Admin', 'DCS', 'Mapas']));

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
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton className="group">
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className={`ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="ml-4 border-l pl-4 mt-2">
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={subItem.href ? page.url.startsWith(subItem.href) : false}
                                                    >
                                                        {subItem.openInNewTab ? (
                                                            <a
                                                                href={subItem.href || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2"
                                                            >
                                                                {subItem.icon && <subItem.icon />}
                                                                <span>{subItem.title}</span>
                                                            </a>
                                                        ) : (
                                                            <Link href={subItem.href || '#'}>
                                                                {subItem.icon && <subItem.icon />}
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        )}
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
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={item.href ? page.url.startsWith(item.href) : false}
                                >
                                    {item.openInNewTab ? (
                                        <a
                                            href={item.href || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2"
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </a>
                                    ) : (
                                        <Link href={item.href || '#'}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
