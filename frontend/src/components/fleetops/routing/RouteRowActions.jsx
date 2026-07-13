import { Eye, MoreHorizontal, Route as RouteIcon, Sparkles, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function RouteRowActions({
  routeId,
  orderIds = [],
  canPlan = false,
  canDelete = false,
  onView,
  onReplan,
  onOptimize,
  onDelete,
}) {
  const hasReplan = canPlan && orderIds.length > 0;

  return (
    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-testid={`route-row-actions-${routeId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem data-testid={`route-view-${routeId}`} onClick={onView}>
            <Eye className="h-3.5 w-3.5 mr-2" />
            View
          </DropdownMenuItem>
          {hasReplan && (
            <DropdownMenuItem data-testid={`route-replan-${routeId}`} onClick={onReplan}>
              <RouteIcon className="h-3.5 w-3.5 mr-2" />
              Re-plan
            </DropdownMenuItem>
          )}
          {canPlan && (
            <DropdownMenuItem data-testid={`route-optimize-${routeId}`} onClick={onOptimize}>
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Optimize
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                data-testid={`route-delete-${routeId}`}
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
