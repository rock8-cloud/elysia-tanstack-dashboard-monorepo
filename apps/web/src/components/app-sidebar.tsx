import { Link, useMatchRoute } from "@tanstack/react-router";
import { ListChecksIcon, ListTodoIcon, PlusIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "#/components/ui/sidebar";

import type { ComponentProps } from "react";

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();
  const isTodoList = Boolean(matchRoute({ to: "/todos", fuzzy: false }));
  const isNewTodo = Boolean(matchRoute({ to: "/todos/new", fuzzy: false }));

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Todos"
              render={<Link to="/todos" aria-label="Todos" />}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ListChecksIcon className="size-4" />
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Todos</span>
                <span className="truncate text-xs text-muted-foreground">Workspace</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isTodoList}
                  tooltip="Todo list"
                  render={<Link to="/todos" />}
                >
                  <ListTodoIcon />
                  <span>Todo list</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isNewTodo}
                  tooltip="New todo"
                  render={<Link to="/todos/new" />}
                >
                  <PlusIcon />
                  <span>New todo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
