"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Filters } from "@/components/filters";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function MobileFilters() {
  const params = useSearchParams();

  const activeCount = [
    ...params.getAll("type"),
    ...params.getAll("continent"),
    ...params.getAll("country"),
    params.get("year_min"),
    params.get("year_max"),
    params.get("oa_only") === "true" ? "oa" : null,
    params.get("sort") && params.get("sort") !== "relevance_score"
      ? "sort"
      : null,
  ].filter(Boolean).length;

  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
          >
            <SlidersHorizontalIcon className="size-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <DrawerContent className="max-h-[80vh] rounded-t-2xl">
        <DrawerHeader className="mx-auto w-full max-w-md px-6 pt-3">
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <div className="mx-auto w-full max-w-md scroll-fade overflow-y-auto px-4 pt-4 pb-6">
          <Filters />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
